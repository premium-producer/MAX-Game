"""Read-only preflight for numbered conflict copies in the active project tree."""
from pathlib import Path
import os
import re
import sys

PROJECT = Path(__file__).resolve().parents[3]
SKIP = {'.git', 'secrets', 'node_modules', '.venv', '__pycache__', 'workspace',
        'upstream', 'incoming', 'client-input', 'figma-exports'}
TEXT = {'.js', '.mjs', '.cjs', '.py', '.json', '.md', '.html', '.css', '.txt',
        '.bat', '.ps1', '.frag', '.vert', '.glsl'}
COPY = re.compile(r' \((?:[2-9]|[1-9][0-9]+)\)(?=\.|$)')

def conflict_copies(root):
    root = Path(root).resolve()
    found = []
    for directory, dirs, names in os.walk(root, followlinks=False):
        dirs[:] = [d for d in dirs if d not in SKIP and not (Path(directory)/d).is_symlink()]
        for name in names:
            p = Path(directory)/name
            if p.suffix.lower() not in TEXT or not COPY.search(name):
                continue
            canonical = p.with_name(COPY.sub('', name))
            if canonical.is_file():
                found.append(p.relative_to(root).as_posix())
    return sorted(found)

if __name__ == '__main__':
    copies = conflict_copies(PROJECT)
    if copies:
        print('Conflicting numbered copies found; review and archive before building:')
        print('\n'.join(copies))
        sys.exit(1)
    print('PASS: no numbered conflict copies in active source/runtime/docs.')
