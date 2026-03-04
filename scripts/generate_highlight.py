#!/usr/bin/env python3
"""Generate a per-file highlight web folder from the template.

Usage: python scripts/generate_highlight.py path/to/code.py [--out name] [--dst DIR]

Creates a folder (default: out_viz_highlight/<name>) containing index.html, app.js, style.css
based on templates/template_highlight with the code embedded in the HTML.
"""

import argparse
import os
import html
import shutil
import sys


def main():
    parser = argparse.ArgumentParser(
        description="Generate highlight viewer from template"
    )
    parser.add_argument("code", help="path to code file to embed")
    parser.add_argument(
        "--out", help="output folder name (defaults to code basename)", default=None
    )
    parser.add_argument(
        "--dst",
        help="destination parent directory (defaults to out_viz_highlight in project root)",
        default=None,
    )
    args = parser.parse_args()

    code_path = os.path.abspath(args.code)
    if not os.path.isfile(code_path):
        print("Error: code file not found:", code_path)
        sys.exit(2)

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    template_dir = os.path.join(project_root, "templates", "template_highlight")
    if not os.path.isdir(template_dir):
        print("Error: template directory not found:", template_dir)
        sys.exit(2)

    name = args.out or os.path.splitext(os.path.basename(code_path))[0]
    dst_parent = (
        os.path.abspath(args.dst)
        if args.dst
        else os.path.join(project_root, "out_viz_highlight")
    )
    out_dir = os.path.join(dst_parent, name)
    os.makedirs(out_dir, exist_ok=True)

    # Read source code and escape for embedding in <code>
    with open(code_path, "r", encoding="utf-8") as f:
        code = f.read()
    code_html = html.escape(code)

    # Copy files, injecting code into index.html
    for fname in ("index.html", "app.js", "style.css"):
        src = os.path.join(template_dir, fname)
        dst = os.path.join(out_dir, fname)
        if not os.path.isfile(src):
            print("Warning: template file missing:", src)
            continue
        if fname == "index.html":
            with open(src, "r", encoding="utf-8") as r:
                content = r.read()
            content = content.replace("__CODE_HTML__", code_html)
            content = content.replace("__FILE_NAME__", os.path.basename(code_path))
            with open(dst, "w", encoding="utf-8") as w:
                w.write(content)
        else:
            shutil.copyfile(src, dst)

    print("Generated highlight viewer in:", out_dir)
    print("Open the index.html file in a browser to use the tool.")


if __name__ == "__main__":
    main()
