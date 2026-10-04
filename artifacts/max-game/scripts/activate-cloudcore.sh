#!/bin/sh
# MAX only: use the existing vidrs.ru static root. No Caddy reload or port changes.
set -eu
release=${1:?release required}
case "$release" in *[!0-9TZ]*|'') echo 'Invalid release'; exit 1;; esac
test "$(hostname)" = vm1237.cloudcore.plus
root=/srv/projects/futuronika/df/max-game
target="$root/releases/$release"
public=/srv/vidrs.ru/public/df/max-game
test -d "$target"
test -d /srv/vidrs.ru/public
test ! -L /srv/vidrs.ru/public/df
mkdir -p /srv/vidrs.ru/public/df
if [ -e "$public" ] || [ -L "$public" ]; then
 test -L "$public"
 test "$(readlink "$public")" = "$root/current"
fi
previous=$(readlink "$root/current" || true)
case "$previous" in ''|"$root"/releases/*) ;; *) echo 'Foreign current, stop'; exit 1;; esac
cd "$target"
sha256sum -c SHA256SUMS > "$root/verified-$release.log"
python3 - "$release" <<'PY'
import json, pathlib, sys
m = json.loads(pathlib.Path('release.json').read_text())
assert m['application'] == 'MAX' and m['release'] == sys.argv[1]
assert len(m['files']) == 200
for name in m['files']:
 p = pathlib.PurePosixPath(name)
 assert not p.is_absolute() and '..' not in p.parts
 assert name in {'index.html','client/index.html','large-blocks/index.html','guided/index.html','guided-line/index.html','guided-reveal/index.html','app.js','guided-app.js','src/journey.css','src/journey-guided.css','src/journey-guided-line.css','src/journey-guided-reveal.css'} or p.parts[0] in {'assets','audio','brand','cards','config','earth','icons','licenses'}
PY
test ! -e "$root/next-$release" && test ! -L "$root/next-$release"
test ! -e "/srv/vidrs.ru/public/df/.max-game-next-$release" && test ! -L "/srv/vidrs.ru/public/df/.max-game-next-$release"
ln -s "$target" "$root/next-$release"
mv -Tf "$root/next-$release" "$root/current"
if [ ! -L "$public" ]; then
 ln -s "$root/current" "/srv/vidrs.ru/public/df/.max-game-next-$release"
 mv -Tf "/srv/vidrs.ru/public/df/.max-game-next-$release" "$public"
fi
printf '%s\n' "release=$release" "previous=$previous" 'url=https://vidrs.ru/df/max-game/'
