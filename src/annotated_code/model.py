from pydantic import BaseModel, StringConstraints
from typing import Annotated, Optional

CSSColorConstraint = StringConstraints(pattern=r"^#[0-9a-fA-F]{6}$")


class Range(BaseModel):
    start_line: int
    end_line: Optional[int] = None
    start_column: Optional[int] = None
    end_column: Optional[int] = None


class Highlight(BaseModel):
    color: Annotated[str, CSSColorConstraint]
    background: Annotated[str, CSSColorConstraint]
    ranges: list[Range]


class Annotation(BaseModel):
    text: str
    highlights: list[Highlight]


class AnnotatedCode(BaseModel):
    code: str
    annotations: list[Annotation]


def str2range(s: str) -> Range:
    """Parse a range string like '1-3' or '5:1-5:10' into a Range object."""
    if "-" in s:
        start, end = s.split("-")
        if ":" in start:
            start_line, start_col = map(int, start.split(":"))
        else:
            start_line, start_col = int(start), None
        if ":" in end:
            end_line, end_col = map(int, end.split(":"))
        else:
            end_line, end_col = int(end), None
        return Range(
            start_line=start_line,
            start_column=start_col,
            end_line=end_line,
            end_column=end_col,
        )
    if ":" in s:
        line, col = map(int, s.split(":"))
        return Range(
            start_line=line,
            start_column=col,
            end_line=line,
            end_column=None,
        )
    return Range(
        start_line=int(s),
        end_line=int(s),
        start_column=None,
        end_column=None,
    )


def str2highlight(s: str) -> Highlight:
    """Parse a highlight string like 'color:#ff0000;background:#ffff00;range:1-3,5:1-5:10' into a Highlight object."""
    parts = s.split(";")
    color = None
    background = None
    ranges = []
    for part in parts:
        if part.startswith("color:"):
            color = part.lstrip("color:").strip()
        elif part.startswith("background:"):
            background = part.lstrip("background:").strip()
        elif part.startswith("range:"):
            range_strs = part.lstrip("range:").strip().split(",")
            for r in range_strs:
                ranges.append(str2range(r.strip()))
    if color is None or background is None:
        raise ValueError("Highlight must have color and background")
    return Highlight(color=color, background=background, ranges=ranges)


def parse_annotation(lines: list[str]) -> Annotation:
    """Parse an annotation string into an Annotation object.

    The annotation string should have the format

        -- color:#ff0000;background:#ffff00;range:1-3,5:1-5:10
        -- color:#00ff00;background:#ffff00;range:4-4

        This is an annotation.

        It can span multiple lines.
    """
    highlights = []
    text_lines = []

    for line in lines:
        line = line.strip()
        if line.startswith("--"):
            highlight_str = line.lstrip("--").strip()
            highlight = str2highlight(highlight_str)
            highlights.append(highlight)
        else:
            text_lines.append(line)
    text = "\n".join(text_lines).strip()
    return Annotation(text=text, highlights=highlights)


def parse_annotations(s: str) -> list[Annotation]:
    """Parse a string containing multiple annotations into a list of Annotation objects."""
    annotations = []
    buffered_lines = []
    for line in s.splitlines():
        line = line.strip()
        if line.startswith("-----"):
            if buffered_lines:
                annotation = parse_annotation(buffered_lines)
                annotations.append(annotation)
            buffered_lines = []
        else:
            buffered_lines.append(line)
    if buffered_lines:
        annotation = parse_annotation(buffered_lines)
        annotations.append(annotation)
    return annotations
