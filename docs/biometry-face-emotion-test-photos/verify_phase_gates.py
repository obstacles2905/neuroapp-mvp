"""Verify 'clear contradiction' gate against blendshape-extract.json.

Philosophy (face-rules-0.3.0): weak/soft expressions are fine (people differ).
We only flag a step when the OPPOSITE emotion was clearly performed.
`matched=True` => acceptable (no clear contradiction).
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = json.loads((ROOT / "blendshape-extract.json").read_text(encoding="utf-8"))

# Mirrors mobile/lib/biometrics/constants/face-scoring.constants.ts (0.3.0)
FACE_BASELINE_CONTRADICTION_SMILE = 0.35
FACE_BASELINE_CONTRADICTION_BROW_DOWN = 0.25
FACE_BASELINE_CONTRADICTION_JAW_OPEN = 0.4
FACE_SMILE_CONTRADICTION_BROW_DOWN = 0.15
FACE_SMILE_CONTRADICTION_MARGIN = 0.1
FACE_FROWN_CONTRADICTION_SMILE = 0.15
FACE_FROWN_CONTRADICTION_MARGIN = 0.1
FACE_SURPRISE_CONTRADICTION_BROW_DOWN = 0.15


def mean(focused: dict, keys: list[str]) -> float:
    return sum(focused.get(k, 0.0) for k in keys) / max(1, len(keys))


def smile(f: dict) -> float:
    return mean(f, ["mouthSmileLeft", "mouthSmileRight"])


def brow_down(f: dict) -> float:
    return mean(f, ["browDownLeft", "browDownRight"])


def surprise_core(f: dict) -> float:
    return mean(f, ["browInnerUp", "eyeWideLeft", "eyeWideRight"])


def baseline_ok(f: dict) -> bool:
    strong = (
        smile(f) >= FACE_BASELINE_CONTRADICTION_SMILE
        or brow_down(f) >= FACE_BASELINE_CONTRADICTION_BROW_DOWN
        or f.get("jawOpen", 0) >= FACE_BASELINE_CONTRADICTION_JAW_OPEN
    )
    return not strong


def smile_ok(f: dict) -> bool:
    clearly_frowning = (
        brow_down(f) >= FACE_SMILE_CONTRADICTION_BROW_DOWN
        and brow_down(f) >= smile(f) + FACE_SMILE_CONTRADICTION_MARGIN
    )
    return not clearly_frowning


def frown_ok(f: dict) -> bool:
    clearly_smiling = (
        smile(f) >= FACE_FROWN_CONTRADICTION_SMILE
        and smile(f) >= brow_down(f) + FACE_FROWN_CONTRADICTION_MARGIN
    )
    return not clearly_smiling


def surprise_ok(f: dict) -> bool:
    clearly_angry = (
        brow_down(f) >= FACE_SURPRISE_CONTRADICTION_BROW_DOWN
        and brow_down(f) >= surprise_core(f)
    )
    return not clearly_angry


# matched (acceptable) expectations under the forgiving 0.3.0 gate:
# - positive photos: acceptable
# - negative photos are acceptable UNLESS they show a clear OPPOSITE emotion.
#   grumpy_negative is a *neutral* face (weak, not opposite) -> now acceptable.
CHECKS = {
    "neutral_positive.jpg": (baseline_ok, True),
    "neutral_negative.jpg": (baseline_ok, False),  # strong grimace on neutral step
    "smile_positive.jpg": (smile_ok, True),
    "smile_negative.jpg": (smile_ok, False),  # clear frown instead of smile
    "grumpy_positive.jpg": (frown_ok, True),
    "grumpy_negative.jpg": (frown_ok, True),  # neutral, not an opposite -> forgiven
    "surprised_positive.jpg": (surprise_ok, True),
    "surprised_negative.jpg": (surprise_ok, False),  # angry glare instead of surprise
}


def main() -> None:
    failed = 0
    for name, (fn, expected) in CHECKS.items():
        focused = DATA[name]["focused"]
        got = fn(focused)
        ok = got == expected
        mark = "OK" if ok else "FAIL"
        if not ok:
            failed += 1
        print(f"{mark:4} {name:24} acceptable_expected={expected} got={got}")
    if failed:
        raise SystemExit(f"{failed} checks failed")
    print("all 8 photos match forgiving-gate expectations")


if __name__ == "__main__":
    main()
