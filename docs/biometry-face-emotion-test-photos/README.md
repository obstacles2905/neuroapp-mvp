# Face emotion regression photos

Набор из 8 фото для калибровки gate «явного противоречия» шагу протокола.

Философия (`face-rules-0.3.0`): слабую/неяркую мимику НЕ считаем ошибкой (люди разные).
Флагаем шаг только если сделана отчётливо ПРОТИВОПОЛОЖНАЯ эмоция.
`acceptable=True` → нет явного противоречия.

| Файл | Шаг | Что на фото | acceptable |
|---|---|---|---|
| `neutral_positive.jpg` | baseline | спокойное лицо | ✅ |
| `neutral_negative.jpg` | baseline | сильная гримаса | ❌ противоречие |
| `smile_positive.jpg` | guided_smile | улыбка | ✅ |
| `smile_negative.jpg` | guided_smile | явная злость/хмурость | ❌ противоречие |
| `grumpy_positive.jpg` | guided_frown | нахмуренные брови | ✅ |
| `grumpy_negative.jpg` | guided_frown | нейтрал (не противоположное) | ✅ прощаем |
| `surprised_positive.jpg` | guided_surprise | удивление | ✅ |
| `surprised_negative.jpg` | guided_surprise | злой оскал | ❌ противоречие |

`grumpy_negative` — нейтральное лицо вместо хмурого: это слабая мимика, а не
противоположная эмоция, поэтому с 0.3.0 такой кадр больше не «ругается».

Пороги живут в `mobile/lib/biometrics/constants/face-scoring.constants.ts` (`face-rules-0.3.0`).

## Переснять blendshapes

```bash
# нужен Python + mediapipe и модель mobile/assets/models/face_landmarker.task
python extract_blendshapes.py
python verify_phase_gates.py
```

`blendshape-extract.json` — снимок коэффициентов после последнего прогона.
