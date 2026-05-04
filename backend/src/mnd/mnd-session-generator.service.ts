import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AppUserMndExerciseCompletionRepository } from '../analytics/app-user-mnd-exercise-completion.repository';
import { AppUserMndJamExerciseDayCompletionRepository } from '../analytics/app-user-mnd-jam-exercise-day-completion.repository';
import { AppUserRepository } from '../analytics/app-user.repository';
import type { AppDailyMndSessionResponseDto } from '../app-onboarding/dto/app-daily-mnd-session-response.dto';
import {
  MND_DAILY_SESSION_STEP_COUNT,
  MND_JAM_SESSION_STEP_COUNT,
  MND_SOS_SESSION_STEP_COUNT,
} from '../common/constants/mnd-session-generator.constant';
import type { MndExercise } from '../common/entity/mnd-exercise.entity';
import type { MndMatrixRule } from '../common/entity/mnd-matrix-rule.entity';
import { MndExerciseDirection } from '../common/enums/mnd-exercise-direction.enum';
import { buildPrioritizedSymptomIdsFromRanks } from '../common/helpers/build-prioritized-symptom-ids-from-ranks.helper';
import { createMulberry32 } from '../common/helpers/create-mulberry32-rng.helper';
import { pickSessionExercisesFromPool } from '../common/helpers/pick-session-exercises.helper';
import { resolveEligibleMasterStackIds } from '../common/helpers/resolve-eligible-master-stack-ids.helper';
import { shuffleCopyWithRng } from '../common/helpers/shuffle-with-rng.helper';
import { splitSessionDirectionCounts } from '../common/helpers/split-session-direction-counts.helper';
import { stringToSeedNumber } from '../common/helpers/string-to-seed-number.helper';
import { utcDateKeyFromDate } from '../common/helpers/utc-date-key.helper';
import { MndExerciseRepository } from './repositories/mnd-exercise.repository';
import { MndMatrixRuleRepository } from './repositories/mnd-matrix-rule.repository';

@Injectable()
export class MndSessionGeneratorService {
  constructor(
    private readonly appUserRepository: AppUserRepository,
    private readonly mndExerciseCompletionRepository: AppUserMndExerciseCompletionRepository,
    private readonly jamDayCompletionRepository: AppUserMndJamExerciseDayCompletionRepository,
    private readonly matrixRuleRepository: MndMatrixRuleRepository,
    private readonly exerciseRepository: MndExerciseRepository,
  ) {}

  async buildDailySessionForUser(
    appUserId: string,
  ): Promise<AppDailyMndSessionResponseDto> {
    const user = await this.appUserRepository.findById(appUserId);
    if (!user) {
      throw new UnauthorizedException();
    }
    const symptomIds = buildPrioritizedSymptomIdsFromRanks(
      user.onboardingSymptomRanks,
    );
    if (symptomIds.length === 0) {
      throw new BadRequestException(
        'Нет выбранных симптомов. Завершите онбординг.',
      );
    }
    const rulesRaw =
      await this.matrixRuleRepository.findBySymptomIdsWithStacks(symptomIds);
    const orderedRules = this.orderRulesBySymptoms(symptomIds, rulesRaw);
    if (orderedRules.length === 0) {
      throw new BadRequestException(
        'Для выбранных симптомов не найдены правила MND-матрицы.',
      );
    }
    const now = new Date();
    const dayKey = utcDateKeyFromDate(now);
    return this.assembleSessionFromOrderedRules({
      appUserId,
      orderedRules,
      stepCount: MND_DAILY_SESSION_STEP_COUNT,
      seedMaterial: `${appUserId}|${dayKey}`,
      at: now,
    });
  }

  async buildSosSessionForUser(
    appUserId: string,
    symptomId: string,
  ): Promise<AppDailyMndSessionResponseDto> {
    const user = await this.appUserRepository.findById(appUserId);
    if (!user) {
      throw new UnauthorizedException();
    }
    const rulesRaw = await this.matrixRuleRepository.findBySymptomIdsWithStacks(
      [symptomId],
    );
    const orderedRules = this.orderRulesBySymptoms([symptomId], rulesRaw);
    if (orderedRules.length === 0) {
      throw new BadRequestException(
        'Для этого симптома нет правила в MND-матрице или симптом не найден.',
      );
    }
    const now = new Date();
    const dayKey = utcDateKeyFromDate(now);
    const utcHour = now.getUTCHours();
    const seedMaterial = `${appUserId}|sos|${symptomId}|${dayKey}|h${String(utcHour)}`;
    return this.assembleSessionFromOrderedRules({
      appUserId,
      orderedRules,
      stepCount: MND_SOS_SESSION_STEP_COUNT,
      seedMaterial,
      at: now,
    });
  }

  async buildJamSessionForUser(
    appUserId: string,
  ): Promise<AppDailyMndSessionResponseDto> {
    const user = await this.appUserRepository.findById(appUserId);
    if (!user) {
      throw new UnauthorizedException();
    }
    const symptomIds = buildPrioritizedSymptomIdsFromRanks(
      user.onboardingSymptomRanks,
    );
    if (symptomIds.length === 0) {
      throw new BadRequestException(
        'Нет выбранных симптомов. Завершите онбординг.',
      );
    }
    const rulesRaw =
      await this.matrixRuleRepository.findBySymptomIdsWithStacks(symptomIds);
    const orderedRules = this.orderRulesBySymptoms(symptomIds, rulesRaw);
    if (orderedRules.length === 0) {
      throw new BadRequestException(
        'Для выбранных симптомов не найдены правила MND-матрицы.',
      );
    }
    const stackIds = resolveEligibleMasterStackIds(orderedRules);
    if (stackIds.length === 0) {
      throw new BadRequestException(
        'Не удалось определить мастер-стеки сессии.',
      );
    }
    const exercises =
      await this.exerciseRepository.findPublishedByMasterStackIds(stackIds);
    const completedIds = new Set(
      await this.mndExerciseCompletionRepository.findMndExerciseIdsCompletedByUser(
        appUserId,
      ),
    );
    const reviewExercises = exercises.filter((e) => completedIds.has(e.id));
    if (reviewExercises.length === 0) {
      throw new BadRequestException(
        'Пока нечего повторять: завершите упражнения из «Сегодня» или SOS, затем откройте джем снова.',
      );
    }
    const now = new Date();
    const dayKey = utcDateKeyFromDate(now);
    const jamCompletedIds = new Set(
      await this.jamDayCompletionRepository.findMndExerciseIdsCompletedOnDay(
        appUserId,
        dayKey,
      ),
    );
    return this.assembleSessionFromOrderedRules({
      appUserId,
      orderedRules,
      stepCount: MND_JAM_SESSION_STEP_COUNT,
      seedMaterial: `${appUserId}|jam|${dayKey}`,
      at: now,
      exercisesOverride: reviewExercises,
      stepCompletedIds: jamCompletedIds,
    });
  }

  private orderRulesBySymptoms(
    symptomIds: string[],
    rules: MndMatrixRule[],
  ): MndMatrixRule[] {
    const bySymptom = new Map(rules.map((r) => [r.symptomId, r]));
    const ordered: MndMatrixRule[] = [];
    for (const id of symptomIds) {
      const rule = bySymptom.get(id);
      if (rule) {
        ordered.push(rule);
      }
    }
    return ordered;
  }

  private async assembleSessionFromOrderedRules(params: {
    appUserId: string;
    orderedRules: MndMatrixRule[];
    stepCount: number;
    seedMaterial: string;
    at: Date;
    exercisesOverride?: MndExercise[];
    /** When set, step `completed` follows this set (e.g. jam completions for the UTC day). */
    stepCompletedIds?: Set<string>;
  }): Promise<AppDailyMndSessionResponseDto> {
    const {
      appUserId,
      orderedRules,
      stepCount,
      seedMaterial,
      at,
      exercisesOverride,
      stepCompletedIds,
    } = params;
    const stackIds = resolveEligibleMasterStackIds(orderedRules);
    if (stackIds.length === 0) {
      throw new BadRequestException(
        'Не удалось определить мастер-стеки сессии.',
      );
    }
    const avgBottom = Math.round(
      orderedRules.reduce((s, r) => s + r.bottomUpPercent, 0) /
        orderedRules.length,
    );
    const exercises =
      exercisesOverride !== undefined
        ? exercisesOverride
        : await this.exerciseRepository.findPublishedByMasterStackIds(stackIds);
    const buPool = exercises.filter(
      (e) => e.direction === MndExerciseDirection.BOTTOM_UP,
    );
    const tdPool = exercises.filter(
      (e) => e.direction === MndExerciseDirection.TOP_DOWN,
    );
    if (buPool.length === 0 && tdPool.length === 0) {
      throw new BadRequestException(
        'Нет опубликованных упражнений MND для выбранных стеков.',
      );
    }
    const { bottomUp, topDown } = splitSessionDirectionCounts(
      stepCount,
      avgBottom,
      buPool.length > 0,
      tdPool.length > 0,
    );
    const dayKey = utcDateKeyFromDate(at);
    const seed = stringToSeedNumber(seedMaterial);
    const rng = createMulberry32(seed);
    const pickBu = pickSessionExercisesFromPool(buPool, bottomUp, rng);
    const pickTd = pickSessionExercisesFromPool(tdPool, topDown, rng);
    const merged = shuffleCopyWithRng([...pickBu, ...pickTd], rng);
    const completedIds =
      stepCompletedIds ??
      new Set(
        await this.mndExerciseCompletionRepository.findMndExerciseIdsCompletedByUser(
          appUserId,
        ),
      );
    return {
      generatedAt: at.toISOString(),
      dayKeyUtc: dayKey,
      avgBottomUpPercent: avgBottom,
      eligibleMasterStackIds: stackIds,
      symptomIdsUsed: orderedRules.map((r) => r.symptomId),
      steps: merged.map((e) => ({
        id: e.id,
        title: e.title,
        direction: e.direction,
        masterStackCode: e.masterStack?.code ?? '',
        complexityLevel: e.complexityLevel,
        completed: completedIds.has(e.id),
      })),
    };
  }
}
