import { MndExerciseDirection } from '../enums/mnd-exercise-direction.enum';
import { MndMasterStackCode } from '../enums/mnd-master-stack-code.enum';
import type {
  MndExerciseSeedRow,
  MndMasterStackSeedRow,
  MndMatrixRuleSeedRow,
  MndSymptomSeedRow,
} from '../types/mnd-seed.type';

export const MND_MASTER_STACK_SEED_ROWS: readonly MndMasterStackSeedRow[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    code: MndMasterStackCode.ST_1,
    titleRu: 'Vagus Reset',
    descriptionRu: 'Парасимпатическая активация: уши, горло, шея.',
    order: 0,
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    code: MndMasterStackCode.ST_2,
    titleRu: 'Jaw & Face',
    descriptionRu: 'Расслабление жевательных мышц и снятие социальной маски.',
    order: 1,
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    code: MndMasterStackCode.ST_3,
    titleRu: 'Gravity & Ground',
    descriptionRu: 'Проприоцепция, чувство веса и баланс.',
    order: 2,
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    code: MndMasterStackCode.ST_4,
    titleRu: 'Panoramic Vision',
    descriptionRu: 'Работа со зрительными полями и снятие туннельного эффекта.',
    order: 3,
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    code: MndMasterStackCode.ST_5,
    titleRu: 'Breath Control',
    descriptionRu:
      'Управление дыханием, газовым составом крови и ритмом сердца.',
    order: 4,
  },
  {
    id: '10000000-0000-4000-8000-000000000006',
    code: MndMasterStackCode.ST_6,
    titleRu: 'Vocal Resonance',
    descriptionRu: 'Вибрационная терапия и уверенность через голос.',
    order: 5,
  },
];

export const MND_SYMPTOM_SEED_ROWS: readonly MndSymptomSeedRow[] = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    code: 'MND-01',
    titleRu: 'Жвачка в голове',
    descriptionRu:
      'Мысли крутятся по кругу, бесконечно прокручивая диалоги и сценарии.',
    neurophysiologicalRootRu: 'Гиперактивность DMN при слабом переключении.',
    order: 0,
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    code: 'MND-02',
    titleRu: 'Сжатая пружина',
    descriptionRu:
      'Физическое ощущение угрозы: челюсти, плечи и невозможность выдохнуть.',
    neurophysiologicalRootRu:
      'Симпатический овердрайв и спазм жевательных мышц.',
    order: 1,
  },
  {
    id: '20000000-0000-4000-8000-000000000003',
    code: 'MND-03',
    titleRu: 'Стеклянная стена',
    descriptionRu: 'Мир кажется декорацией, чувства притуплены и отдалены.',
    neurophysiologicalRootRu:
      'Дорсальный вагус и снижение зеркальной чувствительности.',
    order: 2,
  },
  {
    id: '20000000-0000-4000-8000-000000000004',
    code: 'MND-04',
    titleRu: 'Успех как ожог',
    descriptionRu:
      'Чужой успех воспринимается как болезненное сравнение не в свою пользу.',
    neurophysiologicalRootRu: 'Сбой дофаминовой системы социального сравнения.',
    order: 3,
  },
  {
    id: '20000000-0000-4000-8000-000000000005',
    code: 'MND-05',
    titleRu: 'Яд старых обид',
    descriptionRu:
      'Прошлые конфликты продолжают жить внутри и отравляют момент.',
    neurophysiologicalRootRu:
      'Зацикленность гиппокампа на негативных паттернах.',
    order: 4,
  },
  {
    id: '20000000-0000-4000-8000-000000000006',
    code: 'MND-06',
    titleRu: 'Процессор перегрет',
    descriptionRu:
      'Внимание рассыпается, мозг требует новой дозы цифрового шума.',
    neurophysiologicalRootRu:
      'Истощение внимания и фрагментация префронтальной коры.',
    order: 5,
  },
  {
    id: '20000000-0000-4000-8000-000000000007',
    code: 'MND-07',
    titleRu: 'Режим обороны',
    descriptionRu: 'Любой человек ощущается потенциальным источником проблем.',
    neurophysiologicalRootRu:
      'Гиперсенситивность амигдалы и блок социального вовлечения.',
    order: 6,
  },
  {
    id: '20000000-0000-4000-8000-000000000008',
    code: 'MND-08',
    titleRu: 'Эрозия будущего',
    descriptionRu: 'Кажется, что впереди только повторение вчерашнего дня.',
    neurophysiologicalRootRu:
      'Сбой фронтального моделирования и нейропластичности.',
    order: 7,
  },
  {
    id: '20000000-0000-4000-8000-000000000009',
    code: 'MND-09',
    titleRu: 'Призраки в шкафу',
    descriptionRu: 'Воспоминания стыда всплывают внезапно и бьют под дых.',
    neurophysiologicalRootRu:
      'Аверсивная память без устойчивой телесной опоры.',
    order: 8,
  },
  {
    id: '20000000-0000-4000-8000-000000000010',
    code: 'MND-10',
    titleRu: 'Батарейка на нуле',
    descriptionRu:
      'Усталость уже после пробуждения, любые задачи кажутся тяжелыми.',
    neurophysiologicalRootRu:
      'Метаболический стресс и истощение ресурса выживания.',
    order: 9,
  },
  {
    id: '20000000-0000-4000-8000-000000000011',
    code: 'MND-11',
    titleRu: 'Зеркальный террор',
    descriptionRu: 'Тело ощущается набором дефектов или ошибкой.',
    neurophysiologicalRootRu: 'Искажение схемы тела в теменной коре.',
    order: 10,
  },
  {
    id: '20000000-0000-4000-8000-000000000012',
    code: 'MND-12',
    titleRu: 'Социальный камуфляж',
    descriptionRu:
      'Вежливая маска снаружи и пустота с потерей своего Я внутри.',
    neurophysiologicalRootRu:
      'Блокировка лицевого нерва и зажим мимических мышц.',
    order: 11,
  },
  {
    id: '20000000-0000-4000-8000-000000000013',
    code: 'MND-13',
    titleRu: 'Синдром самозванца',
    descriptionRu:
      'Достижения кажутся случайностью, а разоблачение неизбежным.',
    neurophysiologicalRootRu:
      'Гиперкритика DMN при дефиците базального дофамина.',
    order: 12,
  },
  {
    id: '20000000-0000-4000-8000-000000000014',
    code: 'MND-14',
    titleRu: 'Ментальный паралич',
    descriptionRu: 'Мозг зависает даже перед простейшим выбором.',
    neurophysiologicalRootRu: 'Перегрузка префронтальной коры и оценки рисков.',
    order: 13,
  },
  {
    id: '20000000-0000-4000-8000-000000000015',
    code: 'MND-15',
    titleRu: 'Эмоциональная анестезия',
    descriptionRu: 'Чувства отсутствуют там, где должны возникать.',
    neurophysiologicalRootRu: 'Крайнее дорсальное торможение нервной системы.',
    order: 14,
  },
  {
    id: '20000000-0000-4000-8000-000000000016',
    code: 'MND-16',
    titleRu: 'Бег на месте',
    descriptionRu: 'Много суеты и дел, но к вечеру нет результата.',
    neurophysiologicalRootRu: 'Рассинхрон моторной коры и целеполагания.',
    order: 15,
  },
  {
    id: '20000000-0000-4000-8000-000000000017',
    code: 'MND-17',
    titleRu: 'Синдром дефицита тишины',
    descriptionRu:
      'Трудно выдержать даже несколько минут без телефона или шума.',
    neurophysiologicalRootRu: 'Поломка внутренней системы саморегуляции.',
    order: 16,
  },
  {
    id: '20000000-0000-4000-8000-000000000018',
    code: 'MND-18',
    titleRu: 'Телесный невозврат',
    descriptionRu: 'Сигналы тела замечаются только когда становятся болью.',
    neurophysiologicalRootRu:
      'Дисфункция островковой доли, отвечающей за интероцепцию.',
    order: 17,
  },
  {
    id: '20000000-0000-4000-8000-000000000019',
    code: 'MND-19',
    titleRu: 'Синдром отложенной жизни',
    descriptionRu: 'Настоящая жизнь кажется чем-то, что начнется потом.',
    neurophysiologicalRootRu: 'Серотониновый дефицит в текущем моменте.',
    order: 18,
  },
  {
    id: '20000000-0000-4000-8000-000000000020',
    code: 'MND-20',
    titleRu: 'Взрыв на ровном месте',
    descriptionRu: 'Реакция ярости или слез наступает раньше осознания.',
    neurophysiologicalRootRu:
      'Низкий порог амигдалы при слабом префронтальном торможении.',
    order: 19,
  },
];

export const MND_MATRIX_RULE_SEED_ROWS: readonly MndMatrixRuleSeedRow[] = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    symptomId: '20000000-0000-4000-8000-000000000001',
    targetActionRu: 'Перехват ресурса из дефолт-системы в сенсорную кору.',
    bottomUpPercent: 40,
    topDownPercent: 60,
    stackCodes: [MndMasterStackCode.ST_4, MndMasterStackCode.ST_5],
  },
  {
    id: '30000000-0000-4000-8000-000000000002',
    symptomId: '20000000-0000-4000-8000-000000000002',
    targetActionRu:
      'Сброс боевой готовности через расслабление триггерных зон.',
    bottomUpPercent: 80,
    topDownPercent: 20,
    stackCodes: [MndMasterStackCode.ST_2, MndMasterStackCode.ST_1],
  },
  {
    id: '30000000-0000-4000-8000-000000000003',
    symptomId: '20000000-0000-4000-8000-000000000003',
    targetActionRu:
      'Оживление рецепторов и восстановление плотности границ тела.',
    bottomUpPercent: 70,
    topDownPercent: 30,
    stackCodes: [MndMasterStackCode.ST_3, MndMasterStackCode.ST_6],
  },
  {
    id: '30000000-0000-4000-8000-000000000004',
    symptomId: '20000000-0000-4000-8000-000000000004',
    targetActionRu: 'Возврат из внешней оценки во внутреннюю интроцепцию.',
    bottomUpPercent: 30,
    topDownPercent: 70,
    stackCodes: [MndMasterStackCode.ST_5, MndMasterStackCode.ST_3],
  },
  {
    id: '30000000-0000-4000-8000-000000000005',
    symptomId: '20000000-0000-4000-8000-000000000005',
    targetActionRu: 'Разрыв связи между памятью и мышечным откликом.',
    bottomUpPercent: 40,
    topDownPercent: 60,
    stackCodes: [MndMasterStackCode.ST_1, MndMasterStackCode.ST_6],
  },
  {
    id: '30000000-0000-4000-8000-000000000006',
    symptomId: '20000000-0000-4000-8000-000000000006',
    targetActionRu: 'Сужение фокуса до одной телесной точки для отдыха мозга.',
    bottomUpPercent: 60,
    topDownPercent: 40,
    stackCodes: [MndMasterStackCode.ST_4, MndMasterStackCode.ST_3],
  },
  {
    id: '30000000-0000-4000-8000-000000000007',
    symptomId: '20000000-0000-4000-8000-000000000007',
    targetActionRu: 'Подача сигнала безопасно через блуждающий нерв.',
    bottomUpPercent: 75,
    topDownPercent: 25,
    stackCodes: [MndMasterStackCode.ST_1, MndMasterStackCode.ST_2],
  },
  {
    id: '30000000-0000-4000-8000-000000000008',
    symptomId: '20000000-0000-4000-8000-000000000008',
    targetActionRu:
      'Стимуляция зон мозга, отвечающих за прогноз и воображение.',
    bottomUpPercent: 20,
    topDownPercent: 80,
    stackCodes: [MndMasterStackCode.ST_4, MndMasterStackCode.ST_5],
  },
  {
    id: '30000000-0000-4000-8000-000000000009',
    symptomId: '20000000-0000-4000-8000-000000000009',
    targetActionRu: 'Заземление стыда в физическую устойчивость.',
    bottomUpPercent: 50,
    topDownPercent: 50,
    stackCodes: [MndMasterStackCode.ST_3, MndMasterStackCode.ST_1],
  },
  {
    id: '30000000-0000-4000-8000-000000000010',
    symptomId: '20000000-0000-4000-8000-000000000010',
    targetActionRu: 'Минимизация затрат и переключение в режим зарядки.',
    bottomUpPercent: 90,
    topDownPercent: 10,
    stackCodes: [MndMasterStackCode.ST_5, MndMasterStackCode.ST_3],
  },
  {
    id: '30000000-0000-4000-8000-000000000011',
    symptomId: '20000000-0000-4000-8000-000000000011',
    targetActionRu: 'Пересборка внутреннего образа через тактильный контакт.',
    bottomUpPercent: 80,
    topDownPercent: 20,
    stackCodes: [MndMasterStackCode.ST_3, MndMasterStackCode.ST_2],
  },
  {
    id: '30000000-0000-4000-8000-000000000012',
    symptomId: '20000000-0000-4000-8000-000000000012',
    targetActionRu: 'Снятие фасциального зажима лица и оживление мимики.',
    bottomUpPercent: 60,
    topDownPercent: 40,
    stackCodes: [MndMasterStackCode.ST_2, MndMasterStackCode.ST_6],
  },
  {
    id: '30000000-0000-4000-8000-000000000013',
    symptomId: '20000000-0000-4000-8000-000000000013',
    targetActionRu: 'Формирование тела победителя через осанку и голос.',
    bottomUpPercent: 30,
    topDownPercent: 70,
    stackCodes: [MndMasterStackCode.ST_6, MndMasterStackCode.ST_3],
  },
  {
    id: '30000000-0000-4000-8000-000000000014',
    symptomId: '20000000-0000-4000-8000-000000000014',
    targetActionRu: 'Снижение нейронного шума через разблокировку челюсти.',
    bottomUpPercent: 40,
    topDownPercent: 60,
    stackCodes: [MndMasterStackCode.ST_2, MndMasterStackCode.ST_5],
  },
  {
    id: '30000000-0000-4000-8000-000000000015',
    symptomId: '20000000-0000-4000-8000-000000000015',
    targetActionRu: 'Медленное оттаивание через тепло и микровибрации.',
    bottomUpPercent: 85,
    topDownPercent: 15,
    stackCodes: [MndMasterStackCode.ST_3, MndMasterStackCode.ST_1],
  },
  {
    id: '30000000-0000-4000-8000-000000000016',
    symptomId: '20000000-0000-4000-8000-000000000016',
    targetActionRu: 'Обучение мозга завершать физический цикл действия.',
    bottomUpPercent: 50,
    topDownPercent: 50,
    stackCodes: [MndMasterStackCode.ST_3, MndMasterStackCode.ST_4],
  },
  {
    id: '30000000-0000-4000-8000-000000000017',
    symptomId: '20000000-0000-4000-8000-000000000017',
    targetActionRu: 'Тренировка выносливости к отсутствию внешних стимулов.',
    bottomUpPercent: 40,
    topDownPercent: 60,
    stackCodes: [MndMasterStackCode.ST_5, MndMasterStackCode.ST_1],
  },
  {
    id: '30000000-0000-4000-8000-000000000018',
    symptomId: '20000000-0000-4000-8000-000000000018',
    targetActionRu: 'Экстренное восстановление связи мозг-внутренние органы.',
    bottomUpPercent: 100,
    topDownPercent: 0,
    stackCodes: [MndMasterStackCode.ST_3, MndMasterStackCode.ST_5],
  },
  {
    id: '30000000-0000-4000-8000-000000000019',
    symptomId: '20000000-0000-4000-8000-000000000019',
    targetActionRu: 'Обучение получению кайфа от текущего сенсорного акта.',
    bottomUpPercent: 30,
    topDownPercent: 70,
    stackCodes: [MndMasterStackCode.ST_1, MndMasterStackCode.ST_4],
  },
  {
    id: '30000000-0000-4000-8000-000000000020',
    symptomId: '20000000-0000-4000-8000-000000000020',
    targetActionRu: 'Укрепление тормозного пути через управление выдохом.',
    bottomUpPercent: 70,
    topDownPercent: 30,
    stackCodes: [MndMasterStackCode.ST_5, MndMasterStackCode.ST_2],
  },
];

/** Понятные пользователю заголовки демо-упражнений (порядок = ST-1…ST-6). */
const MND_EXERCISE_DEMO_COPY: readonly {
  readonly bottomUpRu: string;
  readonly topDownRu: string;
}[] = [
  {
    bottomUpRu:
      'Лёгкое «оттягивание» мягкого нёба: язык мягко к небу, расслабленный выдох — тепло в горле и шее',
    topDownRu:
      'Медленный выдох длиннее вдоха и короткая мысль: «я могу выдохнуть опасность из тела»',
  },
  {
    bottomUpRu:
      'Разжать челюсть: кончик языка за нижние зубы, пальцами круговой массаж висков по 20 секунд',
    topDownRu:
      'Заметить зажим в челюсти и произнести вслух одну фразу спокойным, «линивым» голосом',
  },
  {
    bottomUpRu:
      'Стоя или сидя: вес через стопы, микропокачивание вперёд-назад — «где я опираюсь на пол»',
    topDownRu:
      'Назвать вслух три точки контакта тела с опорой и одно ощущение «опоры подо мной»',
  },
  {
    bottomUpRu:
      'Мягкий панорамный взгляд: смотреть в одну точку, но расширять «периферию» без напряжения глаз',
    topDownRu:
      'Описать одним предложением, что видишь по краям поля зрения (стена, свет, контур)',
  },
  {
    bottomUpRu:
      'Рука на живот: три цикла вдох короче, выдох длиннее — живот чуть поднимается на вдохе',
    topDownRu:
      'Выбрать число от 4 до 7 и считать только выдохи до этого числа, не ускоряясь',
  },
  {
    bottomUpRu:
      'Низкий звук «ммм» или жужжание губами 30–40 секунд — вибрация в груди и губах',
    topDownRu:
      'После звука коротко назвать одно качество голоса («теплее», «увереннее») без оценки себя',
  },
];

function buildMndExerciseSeedRows(): MndExerciseSeedRow[] {
  const rows: MndExerciseSeedRow[] = [];
  let seq = 101;
  for (let i = 0; i < MND_MASTER_STACK_SEED_ROWS.length; i++) {
    const stack = MND_MASTER_STACK_SEED_ROWS[i];
    const copy = MND_EXERCISE_DEMO_COPY[i];
    const idBu = `40000000-0000-4000-8000-000000000${String(seq++).padStart(3, '0')}`;
    const idTd = `40000000-0000-4000-8000-000000000${String(seq++).padStart(3, '0')}`;
    rows.push({
      id: idBu,
      masterStackId: stack.id,
      direction: MndExerciseDirection.BOTTOM_UP,
      complexityLevel: 5,
      titleRu: copy.bottomUpRu,
      order: i * 2,
    });
    rows.push({
      id: idTd,
      masterStackId: stack.id,
      direction: MndExerciseDirection.TOP_DOWN,
      complexityLevel: 8,
      titleRu: copy.topDownRu,
      order: i * 2 + 1,
    });
  }
  return rows;
}

export const MND_EXERCISE_SEED_ROWS: readonly MndExerciseSeedRow[] =
  buildMndExerciseSeedRows();
