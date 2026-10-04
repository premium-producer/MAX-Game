#!/bin/sh
set -eu
release=${1:?UTC release required}
case "$release" in *[!0-9TZ]*|'') exit 1;; esac
root=/srv/projects/futuronika/df/max-asset-audit
target="$root/releases/$release"
route=/etc/caddy/sites-enabled/df-max-asset-audit.caddy
unit=/etc/systemd/system/max-asset-audit.service
test -d "$target"
test -s /etc/caddy/max-asset-audit.users
cd "$target"
sha256sum -c SHA256SUMS > "$root/verified-$release.log"
if [ -f "$route" ]; then grep -q '# MAX asset audit; managed by VK_DigitalProducts' "$route"; fi
if [ -f "$unit" ]; then grep -q '# MAX asset audit; managed by VK_DigitalProducts' "$unit"; fi
previous=$(readlink "$root/current" || true)
mkdir -p "$root/backups/$release"
test ! -f "$route" || cp -p "$route" "$root/backups/$release/route.caddy"
test ! -f "$unit" || cp -p "$unit" "$root/backups/$release/service"
test ! -f "$root/data/annotations.json" || cp -p "$root/data/annotations.json" "$root/backups/$release/annotations.json"
test ! -f "$root/data/flow-v3.json" || cp -p "$root/data/flow-v3.json" "$root/backups/$release/flow-v3.json"
chmod 700 "$root/backups"
id max-audit >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin max-audit
install -d -o max-audit -g max-audit -m 700 "$root/data"
rollback() {
 trap - EXIT
 systemctl stop max-asset-audit 2>/dev/null || true
 if [ -n "$previous" ]; then ln -sfn "$previous" "$root/rollback-$release"; mv -Tf "$root/rollback-$release" "$root/current"; fi
 if [ -f "$root/backups/$release/route.caddy" ]; then cp -p "$root/backups/$release/route.caddy" "$route"; else mv "$route" "$root/backups/$release/rejected-route.caddy" 2>/dev/null || true; fi
 if [ -f "$root/backups/$release/service" ]; then
  cp -p "$root/backups/$release/service" "$unit"
  # A legacy server cannot safely accept edits after v3 edits have been saved.
  # Preserve both documents and require reconciliation rather than rewriting data.
  if [ -f "$root/data/flow-v3.json" ] && ! grep -q '^Environment=AUDIT_FLOW_FILE=' "$unit"; then
   printf '\n[Unit]\nConditionPathExists=!%s/data/flow-v3.json\n' "$root" >> "$unit"
   systemctl daemon-reload; systemctl disable --now max-asset-audit
  else
   systemctl daemon-reload; systemctl restart max-asset-audit
  fi
 else
  systemctl disable --now max-asset-audit 2>/dev/null || true
  test ! -f "$unit" || mv "$unit" "$root/backups/$release/rejected-service"
  test ! -L "$root/current" || mv "$root/current" "$root/backups/$release/rejected-current"
  systemctl daemon-reload
 fi
 systemctl reload caddy
}
trap rollback EXIT
cat > "$route" <<'CADDY'
# MAX asset audit; managed by VK_DigitalProducts
@maxAssetAudit {
 host futuronika.pro
 path /df/max-asset-audit /df/max-asset-audit/*
}
handle @maxAssetAudit {
 basic_auth {
  import /etc/caddy/max-asset-audit.users
 }
 route {
  redir /df/max-asset-audit /df/max-asset-audit/editor/ 308
  redir /df/max-asset-audit/ /df/max-asset-audit/editor/ 308
  uri strip_prefix /df/max-asset-audit
  header Cache-Control "no-store"
  header X-Robots-Tag "noindex, nofollow, noarchive"
  handle /editor/api/* {
   uri strip_prefix /editor
   reverse_proxy 127.0.0.1:19431
  }
  handle {
   root * /srv/projects/futuronika/df/max-asset-audit/current/public
   encode zstd gzip
   file_server
  }
 }
}
CADDY
cat > "$unit" <<'UNIT'
# MAX asset audit; managed by VK_DigitalProducts
[Unit]
Description=MAX asset annotation storage
After=network.target
[Service]
User=max-audit
Group=max-audit
WorkingDirectory=/srv/projects/futuronika/df/max-asset-audit/current/server
ExecStart=/usr/local/bin/node /srv/projects/futuronika/df/max-asset-audit/current/server/asset-audit-server.mjs
Environment=AUDIT_STORE_MODULE=/srv/projects/futuronika/df/max-asset-audit/current/server/asset-audit-store.mjs
Environment=AUDIT_CATALOG=/srv/projects/futuronika/df/max-asset-audit/current/public/editor/catalog.json
Environment=AUDIT_FILE=/srv/projects/futuronika/df/max-asset-audit/data/annotations.json
Environment=AUDIT_FLOW_FILE=/srv/projects/futuronika/df/max-asset-audit/data/flow-v3.json
Environment=AUDIT_ORIGIN=https://futuronika.pro
Environment=AUDIT_PORT=19431
Restart=on-failure
RestartSec=3
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/srv/projects/futuronika/df/max-asset-audit/data
[Install]
WantedBy=multi-user.target
UNIT
caddy validate --config /etc/caddy/Caddyfile
ln -s "$target" "$root/next-$release"
mv -Tf "$root/next-$release" "$root/current"
systemctl daemon-reload
systemctl restart max-asset-audit
ready=0
for i in 1 2 3 4 5; do
 if curl --silent --fail http://127.0.0.1:19431/api/max-asset-audit >/dev/null; then ready=1; break; fi
 sleep 1
done
test "$ready" = 1
curl --silent --fail http://127.0.0.1:19431/api/max-asset-flow | /usr/local/bin/node --input-type=module -e '
let data="";for await(const chunk of process.stdin)data+=chunk;
const flow=JSON.parse(data);if(flow.schemaVersion!==3||typeof flow.revision!=="string"||!flow.tasks?.length)process.exit(1);'
systemctl reload caddy
systemctl enable max-asset-audit
trap - EXIT
printf '%s\n' "release=$release" "previous=$previous" 'url=https://futuronika.pro/df/max-asset-audit/editor/'
