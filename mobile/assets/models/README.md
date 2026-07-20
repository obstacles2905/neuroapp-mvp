# MediaPipe model assets

Place `.task` model files here. They are copied into native app bundles by Expo config plugins
(`react-native-mediapipe-posedetection`, `neuro-face-landmarker`).

## Required files

| File | Used by |
|---|---|
| `pose_landmarker_lite.task` | Pose biometry |
| `face_landmarker.task` | Face biometry (blendshapes) |

## Download face model

```powershell
Invoke-WebRequest `
  -Uri "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task" `
  -OutFile "face_landmarker.task"
```

Pose model (if missing):

```powershell
Invoke-WebRequest `
  -Uri "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task" `
  -OutFile "pose_landmarker_lite.task"
```

After adding models, run `npx expo prebuild` (or EAS build) so assets are copied to Android/iOS.
