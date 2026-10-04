#!/bin/sh
# Reuses the project's Caddy static-release deployment, on an isolated client route.
set -eu
release=${1:?release required}
case "$release" in *[!0-9TZ]*|'') echo 'Invalid release'; exit 1;; esac
test ${#release} -eq 16
root=/srv/projects/futuronika/df/max-game-client
target="$root/releases/$release"
route=/etc/caddy/sites-enabled/df-max-game-client.caddy
test -d "$target"
test ! -e "$root/current" || test -L "$root/current"
cd "$target"
sha256sum -c SHA256SUMS > "$root/verified-$release.log"
previous=$(readlink "$root/current" || true)
new_route=0
if [ -f "$route" ]; then
 grep -q '# MAX client 1080; managed by VK_DigitalProducts' "$route" || { echo 'Foreign route'; exit 1; }
else
 new_route=1
 cat > "$route" <<'CADDY'
# MAX client 1080; managed by VK_DigitalProducts
redir /df/max-game-client /df/max-game-client/ 308
handle_path /df/max-game-client/* {
 root * /srv/projects/futuronika/df/max-game-client/current
 encode zstd gzip
 header Cache-Control "no-cache"
 header X-Robots-Tag "noindex, nofollow, noarchive"
 file_server
}
CADDY
fi
activated=0
rollback() {
 if [ "$activated" = 1 ]; then
  if [ -n "$previous" ]; then
   ln -s "$previous" "$root/rollback-$release"
   mv -Tf "$root/rollback-$release" "$root/current"
  else
   test ! -L "$root/current" || unlink "$root/current"
  fi
 fi
 if [ "$new_route" = 1 ]; then mv "$route" "$root/rejected-route-$release.caddy"; fi
}
if ! caddy validate --config /etc/caddy/Caddyfile; then rollback; exit 1; fi
ln -s "$target" "$root/next-$release"
mv -Tf "$root/next-$release" "$root/current"
activated=1
if ! systemctl reload caddy; then rollback; systemctl reload caddy; exit 1; fi
printf '%s\n' "release=$release" "previous=$previous" 'url=https://futuronika.pro/df/max-game-client/'
