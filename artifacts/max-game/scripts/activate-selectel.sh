#!/bin/sh
set -eu
release=${1:?release required}
case "$release" in *[!0-9TZ]*|'') echo 'Invalid release'; exit 1;; esac
site=${2:-vk}
case "$site" in vk|df) ;; *) echo 'Invalid site'; exit 1;; esac
root=/srv/projects/futuronika/$site/max-game
target="$root/releases/$release"
route=/etc/caddy/sites-enabled/$site-max-game.caddy
test -d "$target"
cd "$target"
sha256sum -c SHA256SUMS > "$root/verified-$release.log"
previous=$(readlink "$root/current" || true)
new_route=0
if [ -f "$route" ]; then
  grep -q '# MAX standalone game; managed by VK_DigitalProducts' "$route" || { echo 'Foreign route, stop'; exit 1; }
else
  new_route=1
  cat > "$route" <<CADDY
# MAX standalone game; managed by VK_DigitalProducts
redir /$site/max-game /$site/max-game/ 308
handle_path /$site/max-game/* {
 root * /srv/projects/futuronika/$site/max-game/current
 encode zstd gzip
 header Cache-Control "no-cache"
 header X-Robots-Tag "noindex, nofollow, noarchive"
 file_server
}
CADDY
fi
rollback() {
 if [ -n "$previous" ]; then ln -sfn "$previous" "$root/rollback-$release"; mv -Tf "$root/rollback-$release" "$root/current"; fi
 if [ "$new_route" = 1 ]; then mv "$route" "$root/rejected-route-$release.caddy"; fi
}
if ! caddy validate --config /etc/caddy/Caddyfile; then rollback; exit 1; fi
ln -s "$target" "$root/next-$release"
mv -Tf "$root/next-$release" "$root/current"
if ! systemctl reload caddy; then rollback; exit 1; fi
printf '%s\n' "release=$release" "previous=$previous" "url=https://futuronika.pro/$site/max-game/"
