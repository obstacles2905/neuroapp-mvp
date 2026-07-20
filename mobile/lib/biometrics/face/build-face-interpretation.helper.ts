import {
  FACE_BAND_LOW_MAX,
  FACE_BAND_MID_MAX,
} from '@/lib/biometrics/constants/face-scoring.constants';
import type {
  FaceCaptureQualityResult,
  FaceExpressionProductMetrics,
  FaceMetricBand,
  FaceMetricBandLevel,
  FaceSessionInterpretation,
} from '@/lib/biometrics/types/face-measurement.types';

function resolveBandLevel(score: number): FaceMetricBandLevel {
  if (score < FACE_BAND_LOW_MAX) {
    return 'low';
  }
  if (score < FACE_BAND_MID_MAX) {
    return 'mid';
  }
  return 'high';
}

function buildExpressivenessBand(score: number): FaceMetricBand {
  const level = resolveBandLevel(score);
  if (level === 'low') {
    return {
      label: 'Сдержанная',
      level,
      meaning:
        'Между спокойным лицом и выражениями по инструкции почти нет разницы — похоже на «маску».',
      score,
    };
  }
  if (level === 'mid') {
    return {
      label: 'Умеренная',
      level,
      meaning: 'Лицо меняется по инструкции, но диапазон мимики ещё не очень широкий.',
      score,
    };
  }
  return {
    label: 'Живая',
    level,
    meaning: 'Лицо заметно оживает между спокойствием и выражениями по инструкции.',
    score,
  };
}

function buildTensionBand(score: number): FaceMetricBand {
  const level = resolveBandLevel(score);
  if (level === 'low') {
    return {
      label: 'Расслаблено',
      level,
      meaning: 'В покое рот и челюсть без сильного зажима.',
      score,
    };
  }
  if (level === 'mid') {
    return {
      label: 'Лёгкий зажим',
      level,
      meaning: 'На спокойном лице есть лёгкое напряжение рта или челюсти.',
      score,
    };
  }
  return {
    label: 'Заметный зажим',
    level,
    meaning: 'В покое видно заметное напряжение челюсти или сжатие рта.',
    score,
  };
}

function buildAsymmetryBand(score: number): FaceMetricBand {
  const level = resolveBandLevel(score);
  if (level === 'low') {
    return {
      label: 'Ровно',
      level,
      meaning: 'Левая и правая стороны лица ведут себя похоже.',
      score,
    };
  }
  if (level === 'mid') {
    return {
      label: 'Небольшая',
      level,
      meaning: 'Есть небольшая разница между левой и правой стороной лица.',
      score,
    };
  }
  return {
    label: 'Заметная',
    level,
    meaning:
      'Мимика слева и справа заметно различается — иногда это свет/ракурс, иногда мышечный перекос.',
    score,
  };
}

type StatePortrait = Readonly<{ summary: string; title: string }>;

/**
 * Человеческий «портрет состояния» из комбинации выразительности и напряжения.
 * Обычные прилагательные (живое / спокойное / уставшее / зажатое), без терминов.
 */
const STATE_PORTRAITS: Record<
  FaceMetricBandLevel,
  Record<FaceMetricBandLevel, StatePortrait>
> = {
  low: {
    low: {
      title: 'Спокойное, сдержанное лицо',
      summary: 'Лицо расслаблено, но эмоции почти не проявляются внешне — приглушённая мимика.',
    },
    mid: {
      title: 'Сдержанное, немного уставшее',
      summary: 'Мимика неяркая, и в лице есть лёгкое напряжение — так часто выглядит усталость или сосредоточенность.',
    },
    high: {
      title: 'Уставшее, зажатое лицо',
      summary: 'Лицо малоподвижное и держит напряжение в челюсти — типичная картина усталости или стресса.',
    },
  },
  mid: {
    low: {
      title: 'Спокойное, ровное состояние',
      summary: 'Мимика в среднем диапазоне, лицо расслаблено — спокойное рабочее состояние.',
    },
    mid: {
      title: 'Ровное, чуть напряжённое',
      summary: 'Мимика обычная, но чувствуется лёгкий зажим — стоит дать лицу немного отдохнуть.',
    },
    high: {
      title: 'Подвижное, но напряжённое',
      summary: 'Лицо реагирует, но заметно держит напряжение — похоже на состояние «на нервах».',
    },
  },
  high: {
    low: {
      title: 'Живое и расслабленное лицо',
      summary: 'Мимика яркая, лицо свободное — открытое, ненапряжённое состояние.',
    },
    mid: {
      title: 'Живое, с лёгким напряжением',
      summary: 'Эмоции проявляются хорошо, но есть небольшой зажим в челюсти.',
    },
    high: {
      title: 'Эмоциональное, но зажатое',
      summary: 'Лицо очень выразительное и при этом сильно напряжённое — много эмоций и одновременно зажим.',
    },
  },
};

function faceDetectionFailed(quality: FaceCaptureQualityResult): boolean {
  return quality.overall === 'failed';
}

function hasClearContradiction(quality: FaceCaptureQualityResult): boolean {
  return (quality.phaseCompliance ?? []).some((item) => !item.matched);
}

function buildNextStep(
  expressiveness: FaceMetricBand,
  facialTension: FaceMetricBand,
  asymmetry: FaceMetricBand,
): string {
  if (facialTension.level === 'high') {
    return 'Дай лицу и челюсти отдохнуть: пара минут мягкого расслабления рта и бровей помогут снять зажим.';
  }
  if (expressiveness.level === 'low') {
    return 'Для оживления мимики хорошо заходят упражнения для лица из раздела практик.';
  }
  if (asymmetry.level === 'high') {
    return 'Если перекос повторяется и при ровном свете — обрати внимание на симметрию лица в упражнениях.';
  }
  return 'Хорошая точка отсчёта — сохрани замер и сравни ощущения после практики.';
}

function buildTone(
  expressiveness: FaceMetricBand,
  facialTension: FaceMetricBand,
  contradiction: boolean,
): FaceSessionInterpretation['tone'] {
  if (facialTension.level === 'high') {
    return 'attention';
  }
  if (
    !contradiction &&
    expressiveness.level === 'high' &&
    facialTension.level === 'low'
  ) {
    return 'positive';
  }
  return 'neutral';
}

export function buildFaceInterpretation(
  metrics: FaceExpressionProductMetrics,
  quality: FaceCaptureQualityResult,
): FaceSessionInterpretation {
  const expressiveness = buildExpressivenessBand(metrics.expressivenessScore);
  const facialTension = buildTensionBand(metrics.facialTensionScore);
  const asymmetry = buildAsymmetryBand(metrics.asymmetryScore);

  if (faceDetectionFailed(quality)) {
    return {
      asymmetry,
      bullets: [
        quality.retryHints[0] ??
          'Лицо не удалось уверенно разглядеть на кадрах.',
      ],
      disclaimerLine:
        'Наблюдение по одному замеру, не медицинский вывод.',
      expressiveness,
      facialTension,
      headline: 'Замер не получилось прочитать',
      nextStep: 'Пересними при ровном свете, лицом к камере — без сильного наклона.',
      tone: 'attention',
    };
  }

  const portrait = STATE_PORTRAITS[expressiveness.level][facialTension.level];
  const contradiction = hasClearContradiction(quality);
  const bullets: string[] = [portrait.summary];

  if (asymmetry.level === 'high') {
    bullets.push(
      'Ещё заметна разница между левой и правой сторонами лица — чаще это свет или ракурс, реже привычный перекос.',
    );
  }

  if (contradiction) {
    bullets.push(
      'Пара шагов вышла приблизительно, поэтому показатели могут быть чуть неточными — при желании переснимай, это не ошибка.',
    );
  }

  return {
    asymmetry,
    bullets,
    disclaimerLine:
      'Это наблюдение по одному замеру, не медицинский вывод. После нескольких замеров картина станет точнее.',
    expressiveness,
    facialTension,
    headline: portrait.title,
    nextStep: buildNextStep(expressiveness, facialTension, asymmetry),
    tone: buildTone(expressiveness, facialTension, contradiction),
  };
}
