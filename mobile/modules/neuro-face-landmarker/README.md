# neuro-face-landmarker

Локальный TurboModule для MediaPipe Face Landmarker (52 blendshapes, on-device).

## Установка в Neuro mobile

Уже подключён в `mobile/package.json` как `file:./modules/neuro-face-landmarker` и в `app.json` plugins.

## Модель

Скачайте `face_landmarker.task` в `mobile/assets/models/` — см. `mobile/assets/models/README.md`.

## Сборка

Expo Go **не поддерживает** этот модуль. Нужен development build:

```bash
cd mobile
npm install
npx expo prebuild
npx expo run:android
# или
npx expo run:ios
```

## JS API

TurboModule `NeuroFaceLandmarker.detectOnImage(...)` — см. `src/NativeNeuroFaceLandmarker.ts`.

Приложение вызывает через `mobile/lib/biometrics/mediapipe/detect-face-on-image.ts`.

## Пересчёт метрик без повторного инференса

После сессии blendshapes сохраняются в `face-sessions/{id}/phase-snapshots.json`.
Кнопка «Пересчитать метрики» в UI вызывает `recomputePersistedFaceSession()`.
