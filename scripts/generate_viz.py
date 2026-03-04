#!/usr/bin/env python3
"""Generate a self-contained folder with HTML/CSS/JS to visualize an AnnotatedCode JSON.

Usage:
  python3 scripts/generate_viz.py output_folder [example]

If you pass 'example' as second arg the script will write a sample `example.json`.
"""
from pathlib import Path
import json
import sys

from annotated_code.model import AnnotatedCode, parse_annotations


def write_all(
    outdir: Path,
    template_dir: Path,
    code_file: Path,
    annot_file: Path,
):
    outdir.mkdir(parents=True, exist_ok=True)
    template_dir = Path(template_dir)
    # read embedded data from template/example.json if present
    code = code_file.read_text(encoding="utf-8")
    annotations = parse_annotations(annot_file.read_text(encoding="utf-8"))
    annotated_code = AnnotatedCode(code=code, annotations=annotations)
    embedded = annotated_code.model_dump()

    for path in sorted(template_dir.iterdir()):
        if path.name == "example.json":
            continue
        if path.is_file():
            content = path.read_text(encoding="utf-8")
            if path.name == "app.js":
                content = content.replace("__EMBEDDED_JSON__", json.dumps(embedded))
            (outdir / path.name).write_text(content, encoding="utf-8")


def main():
    if len(sys.argv) < 5:
        print("usage: scripts/generate_viz.py output_folder template_folder [example]")
        sys.exit(1)
    out = Path(sys.argv[1])
    template = Path(sys.argv[2])
    code_file = Path(sys.argv[3])
    annot_file = Path(sys.argv[4])
    write_all(out, template, code_file, annot_file)
    print("Wrote files to", out)
    print("Open", out / "index.html", "in your browser.")


if __name__ == "__main__":
    main()
