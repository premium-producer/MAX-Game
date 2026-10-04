"""Publish only the isolated MAX editor. Credentials never enter release files/logs."""
import json, pathlib, subprocess, sys, tarfile

root = pathlib.Path(__file__).resolve().parents[3]
release = sys.argv[1]
if len(release) != 16 or not release[:8].isdigit() or release[8] != 'T' or not release[9:15].isdigit() or release[-1] != 'Z':
    raise SystemExit('Invalid release')
package = root / 'artifacts/workspace/dist/max-asset-audit' / release
remote = '/srv/projects/futuronika/df/max-asset-audit'
profile = pathlib.Path.home() / '.ssh/selectel-vidrs.conf'
ssh = ['ssh', '-F', str(profile), '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', 'selectel-vidrs']
scp = ['scp', '-F', str(profile), '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes']
def call(command, **kwargs):
    return subprocess.run(command, check=True, **kwargs)
def remote_call(command, **kwargs):
    return call(ssh + [command], **kwargs)

if not (package / 'SHA256SUMS').is_file():
    raise SystemExit('Build/package first')
remote_call(f'set -e; test ! -e {remote}/releases/{release}; test -x /usr/local/bin/node; test -d /etc/caddy/sites-enabled')
credentials = root / 'secrets/max-asset-audit-selectel.json'
credentials.parent.mkdir(exist_ok=True)
if not credentials.is_file():
    raise SystemExit('Explicit access settings required in secrets/max-asset-audit-selectel.json')
access = json.loads(credentials.read_text(encoding='utf-8'))
auth_exists = subprocess.run(ssh + ['test -s /etc/caddy/max-asset-audit.users'], capture_output=True).returncode == 0
if not auth_exists:
    hashed = remote_call('caddy hash-password',input=(access['password']+'\n').encode(),capture_output=True).stdout.decode().strip()
    if not hashed.startswith('$2'):
        raise SystemExit('Unexpected Caddy hash')
    auth_line = access['username']+' '+hashed+'\n'
    remote_call('umask 027; cat > /etc/caddy/max-asset-audit.users; chown root:caddy /etc/caddy/max-asset-audit.users; chmod 640 /etc/caddy/max-asset-audit.users',input=auth_line.encode(),capture_output=True)
archive = package.parent / (release+'.tar.gz')
with tarfile.open(archive,'w:gz') as tar:
    for item in sorted(package.rglob('*')):
        if item.is_file():
            tar.add(item,arcname=item.relative_to(package).as_posix())
# User explicitly requested no annotation transfer. Never read or upload local data.
remote_call(f'mkdir -p {remote}/releases/{release}')
call(scp+[str(archive),'selectel-vidrs:/root/max-asset-audit-upload.tar.gz'])
remote_call(f'set -e; tar -xzf /root/max-asset-audit-upload.tar.gz -C {remote}/releases/{release}; find {remote}/releases/{release} -type d -exec chmod 755 {{}} +; find {remote}/releases/{release} -type f -exec chmod 644 {{}} +; sh -n {remote}/releases/{release}/activate.sh; sh {remote}/releases/{release}/activate.sh {release}')
print(json.dumps({'url':access['url'],'credentialsFile':str(credentials),'release':release}))
