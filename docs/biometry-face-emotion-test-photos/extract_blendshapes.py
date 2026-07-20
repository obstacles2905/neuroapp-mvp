"""One-off: extract MediaPipe Face Landmarker blendshapes from regression photos."""

from __future__ import annotations

import json
import os
from pathlib import Path

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[1]
MODEL = REPO / "mobile" / "assets" / "models" / "face_landmarker.task"

TARGET_KEYS = {
    "baseline": [
        "mouthSmileLeft",
        "mouthSmileRight",
        "cheekSquintLeft",
        "cheekSquintRight",
        "browDownLeft",
        "browDownRight",
        "browInnerUp",
        "eyeWideLeft",
        "eyeWideRight",
        "jawOpen",
        "mouthPressLeft",
        "mouthPressRight",
        "mouthPucker",
        "mouthClose",
        "noseSneerLeft",
        "noseSneerRight",
        "mouthFrownLeft",
        "mouthFrownRight",
    ],
    "guided_smile": [
        "mouthSmileLeft",
        "mouthSmileRight",
        "cheekSquintLeft",
        "cheekSquintRight",
        "browDownLeft",
        "browDownRight",
        "noseSneerLeft",
        "noseSneerRight",
        "mouthFrownLeft",
        "mouthFrownRight",
        "jawOpen",
    ],
    "guided_frown": [
        "browDownLeft",
        "browDownRight",
        "browInnerUp",
        "mouthSmileLeft",
        "mouthSmileRight",
        "noseSneerLeft",
        "noseSneerRight",
        "mouthFrownLeft",
        "mouthFrownRight",
    ],
    "guided_surprise": [
        "browInnerUp",
        "eyeWideLeft",
        "eyeWideRight",
        "jawOpen",
        "browDownLeft",
        "browDownRight",
        "mouthSmileLeft",
        "mouthSmileRight",
        "noseSneerLeft",
        "noseSneerRight",
    ],
}

FILES = {
    "neutral_positive.jpg": "baseline",
    "neutral_negative.jpg": "baseline",
    "smile_positive.jpg": "guided_smile",
    "smile_negative.jpg": "guided_smile",
    "grumpy_positive.jpg": "guided_frown",
    "grumpy_negative.jpg": "guided_frown",
    "surprised_positive.jpg": "guided_surprise",
    "surprised_negative.jpg": "guided_surprise",
}


def mean(d: dict[str, float], keys: list[str]) -> float:
    vals = [d.get(k, 0.0) for k in keys]
    return sum(vals) / max(1, len(vals))


def main() -> None:
    if not MODEL.exists():
        raise SystemExit(f"model missing: {MODEL}")

    base_options = python.BaseOptions(model_asset_path=str(MODEL))
    options = vision.FaceLandmarkerOptions(
        base_options=base_options,
        output_face_blendshapes=True,
        output_facial_transformation_matrixes=False,
        num_faces=1,
    )
    landmarker = vision.FaceLandmarker.create_from_options(options)

    report: dict[str, object] = {}
    for name, phase in FILES.items():
        path = ROOT / name
        image = mp.Image.create_from_file(str(path))
        result = landmarker.detect(image)
        if not result.face_blendshapes:
            report[name] = {"error": "no_face"}
            continue
        cats = result.face_blendshapes[0]
        full = {c.category_name: round(float(c.score), 4) for c in cats}
        keys = TARGET_KEYS[phase]
        focused = {k: full.get(k, 0.0) for k in keys}
        report[name] = {
            "phase": phase,
            "focused": focused,
            "target_means": {
                "smile": mean(
                    full,
                    [
                        "mouthSmileLeft",
                        "mouthSmileRight",
                        "cheekSquintLeft",
                        "cheekSquintRight",
                    ],
                ),
                "frown": mean(full, ["browDownLeft", "browDownRight", "browInnerUp"]),
                "surprise": mean(
                    full,
                    ["browInnerUp", "eyeWideLeft", "eyeWideRight", "jawOpen"],
                ),
                "anger_proxy": mean(
                    full,
                    [
                        "browDownLeft",
                        "browDownRight",
                        "noseSneerLeft",
                        "noseSneerRight",
                        "mouthFrownLeft",
                        "mouthFrownRight",
                    ],
                ),
                "tension": mean(
                    full,
                    [
                        "mouthPressLeft",
                        "mouthPressRight",
                        "mouthPucker",
                        "mouthClose",
                        "jawOpen",
                    ],
                ),
                "asym": (
                    abs(full.get("mouthSmileLeft", 0) - full.get("mouthSmileRight", 0))
                    + abs(full.get("browDownLeft", 0) - full.get("browDownRight", 0))
                    + abs(full.get("eyeSquintLeft", 0) - full.get("eyeSquintRight", 0))
                    + abs(full.get("cheekSquintLeft", 0) - full.get("cheekSquintRight", 0))
                    + abs(full.get("mouthPressLeft", 0) - full.get("mouthPressRight", 0))
                )
                / 5,
            },
        }

    out = ROOT / "blendshape-extract.json"
    out.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(out)
    for name, payload in report.items():
        if isinstance(payload, dict) and "target_means" in payload:
            tm = payload["target_means"]
            print(
                f"{name:24} smile={tm['smile']:.3f} frown={tm['frown']:.3f} "
                f"surprise={tm['surprise']:.3f} anger={tm['anger_proxy']:.3f} "
                f"tension={tm['tension']:.3f} asym={tm['asym']:.3f}"
            )


if __name__ == "__main__":
    main()
