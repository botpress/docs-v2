#!/usr/bin/env python3
"""Fix over-indented closing tags for MDX callout components.

In MDX, a closing tag like </Info> must be at the same indentation level
as its opening <Info> tag. When the last child is a markdown list item,
editors sometimes indent the closing tag to match the list, which breaks
the MDX parser.
"""

import re
import sys
from pathlib import Path

CALLOUT_TAGS = ['Info', 'Check', 'Tip', 'Warning', 'Note']
_tags = '|'.join(CALLOUT_TAGS)

OPEN_RE = re.compile(r'^(\s*)<(' + _tags + r')(\s[^>]*)?>$')
CLOSE_RE = re.compile(r'^(\s*)</(' + _tags + r')>$')
FENCE_RE = re.compile(r'^(\s*)```')


def fix_file(filepath: Path) -> bool:
    lines = filepath.read_text().split('\n')
    stack: list[tuple[str, str]] = []  # (tag_name, indent_str)
    new_lines: list[str] = []
    changed = False
    in_code_block = False

    for line in lines:
        # Track fenced code blocks so we don't touch tags inside them
        if FENCE_RE.match(line):
            in_code_block = not in_code_block
            new_lines.append(line)
            continue

        if in_code_block:
            new_lines.append(line)
            continue

        open_m = OPEN_RE.match(line)
        if open_m:
            stack.append((open_m.group(2), open_m.group(1)))
            new_lines.append(line)
            continue

        close_m = CLOSE_RE.match(line)
        if close_m:
            current_indent = close_m.group(1)
            tag = close_m.group(2)
            # Walk the stack backwards to find the matching opening tag
            for i in range(len(stack) - 1, -1, -1):
                if stack[i][0] == tag:
                    expected_indent = stack[i][1]
                    stack.pop(i)
                    # Only fix when the closing tag is over-indented; an
                    # under-indented closing tag doesn't cause MDX list-item
                    # parse errors and is left as-is.
                    if len(current_indent) > len(expected_indent):
                        new_lines.append(f'{expected_indent}</{tag}>')
                        changed = True
                    else:
                        new_lines.append(line)
                    break
            else:
                new_lines.append(line)
            continue

        new_lines.append(line)

    if changed:
        filepath.write_text('\n'.join(new_lines))
    return changed


def main(target: str | None = None) -> None:
    if target:
        root = Path(target)
    else:
        root = Path(__file__).parent.parent / 'src/content/docs/integrations'

    mdx_files = sorted(root.rglob('*.mdx'))
    if not mdx_files:
        print(f'No .mdx files found under {root}')
        sys.exit(1)

    fixed: list[Path] = []
    for path in mdx_files:
        if fix_file(path):
            fixed.append(path)
            print(f'Fixed: {path.relative_to(root)}')

    print(f'\n{len(fixed)}/{len(mdx_files)} files updated.')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else None)
