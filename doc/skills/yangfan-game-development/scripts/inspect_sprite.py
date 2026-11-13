#!/usr/bin/env python3
"""Read-only sprite/atlas audit. Requires Python 3 and Pillow; emits JSON."""

import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

from PIL import Image


def number(value):
    return type(value) in (int, float) and math.isfinite(value)


def check_frames(manifest, rgba):
    errors = []
    frames = manifest.get("frames") if isinstance(manifest, dict) else None
    if isinstance(frames, list):
        entries = [(f.get("id") if isinstance(f, dict) else None, f) for f in frames]
    elif isinstance(frames, dict):
        entries = list(frames.items())
    else:
        return 0, ["manifest.frames must be an array or an object"]
    if not entries:
        return 0, ["manifest.frames is empty"]

    seen = set()
    for index, (frame_id, frame) in enumerate(entries):
        label = f"frame[{index}] ({frame_id})"
        if not isinstance(frame_id, str) or not frame_id.strip():
            errors.append(f"{label}: id must be a non-empty string")
        elif frame_id in seen:
            errors.append(f"{label}: duplicate id")
        else:
            seen.add(frame_id)
        if not isinstance(frame, dict):
            errors.append(f"{label}: frame must be an object")
            continue
        rect = frame.get("atlas")
        if not isinstance(rect, list) or len(rect) != 4 or any(type(v) is not int for v in rect):
            errors.append(f"{label}: atlas must contain four integers [x,y,width,height]")
            continue
        x, y, width, height = rect
        if x < 0 or y < 0 or width <= 0 or height <= 0 or x + width > rgba.width or y + height > rgba.height:
            errors.append(f"{label}: atlas rectangle is outside the image or has no area")
        elif rgba.crop((x, y, x + width, y + height)).getchannel("A").getbbox() is None:
            errors.append(f"{label}: frame has no visible pixels")
        anchor = frame.get("anchor")
        if "anchor" in frame and (
            not isinstance(anchor, list) or len(anchor) != 2 or not all(number(v) for v in anchor)
        ):
            errors.append(f"{label}: anchor must contain two finite numbers")
    return len(entries), errors


def inspect_sprite(image_path, frames_path=None, compare_path=None, require_transparency=False):
    image_path = Path(image_path)
    with Image.open(image_path) as source:
        original_mode = source.mode
        rgba = source.convert("RGBA")
    alpha = rgba.getchannel("A").histogram()
    report = {
        "image": str(image_path.resolve()),
        "size": list(rgba.size),
        "mode": original_mode,
        "bytes": image_path.stat().st_size,
        "sha256": hashlib.sha256(image_path.read_bytes()).hexdigest(),
        "pixels": {
            "transparent": alpha[0],
            "partialAlpha": sum(alpha[1:255]),
            "opaque": alpha[255],
        },
        "errors": [],
    }
    errors = report["errors"]
    if require_transparency:
        if alpha[0] == 0:
            errors.append("image has no fully transparent background pixels")
        if sum(alpha[1:]) == 0:
            errors.append("image has no visible pixels")
    if frames_path is not None:
        manifest = json.loads(Path(frames_path).read_text(encoding="utf-8-sig"))
        report["framesChecked"], frame_errors = check_frames(manifest, rgba)
        errors.extend(frame_errors)
    if compare_path is not None:
        with Image.open(compare_path) as reference:
            reference_rgba = reference.convert("RGBA")
        same = rgba.size == reference_rgba.size and rgba.tobytes() == reference_rgba.tobytes()
        report["comparison"] = {
            "reference": str(Path(compare_path).resolve()),
            "referenceSize": list(reference_rgba.size),
            "decodedRGBAEqual": same,
        }
        if not same:
            errors.append("decoded RGBA pixels or image dimensions differ from reference")
    report["ok"] = not errors
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path)
    parser.add_argument("--frames", type=Path, help="JSON with frames and atlas [x,y,w,h] rectangles")
    parser.add_argument("--compare", type=Path, help="Require exact decoded RGBA equality with this image")
    parser.add_argument("--require-transparency", action="store_true")
    args = parser.parse_args()
    try:
        report = inspect_sprite(args.image, args.frames, args.compare, args.require_transparency)
    except (OSError, ValueError, Image.DecompressionBombError) as error:
        report = {"ok": False, "errors": [str(error)]}
    # ASCII escapes keep JSON usable even in legacy Windows console encodings.
    print(json.dumps(report, ensure_ascii=True, indent=2))
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
