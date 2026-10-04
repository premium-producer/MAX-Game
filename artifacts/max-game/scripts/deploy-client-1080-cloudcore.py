"""Mirror a verified client release through CloudCore's existing static file server."""
import hashlib, json, pathlib, re, subprocess, sys, tarfile

project = pathlib.Path(__file__).resolve().parents[3]
release = sys.argv[1]
if not re.fullmatch(r'\d{8}T\d{6}Z', release):
    raise ValueError('Invalid release')
package = project / 'artifacts/workspace/dist/max-game-client' / release
manifest = json.loads((package / 'release.json').read_text(encoding='utf-8'))
if manifest['profile'] != 'client-1920x1080' or manifest['release'] != release:
    raise ValueError('Unexpected package')
archive = package.parent / f'{release}.tar.gz'
with tarfile.open(archive, 'r:gz') as tar:
    expected = {*manifest['files'], 'release.json', 'SHA256SUMS'}
    if {entry.name for entry in tar.getmembers()} != expected:
        raise ValueError('Unexpected archive entries')
    for name in expected:
        entry = tar.getmember(name)
        if not entry.isfile() or '..' in pathlib.PurePosixPath(name).parts or name.startswith('/'):
            raise ValueError('Unsafe archive entry')
        data = tar.extractfile(entry).read()
        digest = hashlib.sha256(data).hexdigest()
        if data != (package / name).read_bytes() or (name in manifest['files'] and digest != manifest['files'][name]):
            raise ValueError(f'Package mismatch: {name}')
profile = str(project / 'secrets/secrets/VPS/CloudCore_VPS/ssh_config')
ssh = ['ssh', '-F', profile, 'vidrs-vps']
scp = ['scp', '-F', profile]
root = '/srv/projects/futuronika/df/max-game-client'
target = f'{root}/releases/{release}'
public = '/srv/vidrs.ru/public/df/max-game-client'
upload = f'/home/bot/max-client-{release}.tar.gz'
subprocess.run(ssh + [f'test ! -e {target} && test ! -e {root}/current && test ! -L {root}/current && test ! -e {public} && test ! -L {public} && test ! -e {upload}'], check=True)
subprocess.run(scp + [str(archive), f'vidrs-vps:{upload}'], check=True)
remote = f'''set -eu
test "$(sha256sum {upload} | cut -d ' ' -f1)" = "{hashlib.sha256(archive.read_bytes()).hexdigest()}"
sudo -n mkdir -p {root}/releases
sudo -n mkdir {target}
sudo -n tar -xzf {upload} -C {target}
sudo -n find {target} -type d -exec chmod 755 {{}} +
sudo -n find {target} -type f -exec chmod 644 {{}} +
cd {target}
sha256sum -c SHA256SUMS > /home/bot/max-client-verified-{release}.log
sudo -n ln -s {target} {root}/current
if ! sudo -n ln -s {root}/current {public}; then sudo -n unlink {root}/current; exit 1; fi
printf '%s\\n' 'release={release}' 'url=https://vidrs.ru/df/max-game-client/'
'''
subprocess.run(ssh + [remote], check=True)
