"""Publish only the isolated MAX client entry; never copy editor data or credentials."""
import json, pathlib, re, subprocess, sys, tarfile

project = pathlib.Path(__file__).resolve().parents[3]
release = sys.argv[1]
if not re.fullmatch(r'\d{8}T\d{6}Z', release):
    raise ValueError('Invalid release')
package = project / 'artifacts/workspace/dist/max-game-client' / release
manifest = json.loads((package / 'release.json').read_text(encoding='utf-8'))
if manifest['profile'] != 'client-1920x1080' or manifest['release'] != release:
    raise ValueError('Unexpected package')
profile = str(pathlib.Path.home() / '.ssh/selectel-vidrs.conf')
ssh = ['ssh', '-F', profile, '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', 'selectel-vidrs']
scp = ['scp', '-F', profile, '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes']
root = '/srv/projects/futuronika/df/max-game-client'
target = f'{root}/releases/{release}'
archive = package.parent / f'{release}.tar.gz'
with tarfile.open(archive, 'w:gz') as tar:
    for name in [*manifest['files'], 'release.json', 'SHA256SUMS']:
        if pathlib.PurePosixPath(name).is_absolute() or '..' in pathlib.PurePosixPath(name).parts:
            raise ValueError('Unsafe package path')
        tar.add(package / name, arcname=name, recursive=False)
subprocess.run(ssh + [f'test ! -e {target} && mkdir -p {root}/releases && mkdir {target}'], check=True)
upload = f'{root}/upload-{release}.tar.gz'
activation = f'{root}/activate-{release}.sh'
subprocess.run(scp + [str(archive), f'selectel-vidrs:{upload}'], check=True)
subprocess.run(scp + [str(pathlib.Path(__file__).with_name('activate-client-1080.sh')), f'selectel-vidrs:{activation}'], check=True)
subprocess.run(ssh + [f'set -e; tar -xzf {upload} -C {target}; find {target} -type d -exec chmod 755 {{}} +; find {target} -type f -exec chmod 644 {{}} +; sh -n {activation}; sh {activation} {release}'], check=True)
