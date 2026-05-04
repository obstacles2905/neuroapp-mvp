import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  MndExercise,
  MndExerciseBlock,
  MndExerciseStep,
  MndMasterStack,
  MndMatrixRule,
  MndMatrixRuleStack,
  MndSymptom,
} from '../common/entity';
import { AnalyticsModule } from '../analytics/analytics.module';
import { MndExerciseController } from './mnd-exercise.controller';
import { MndExerciseStepController } from './mnd-exercise-step.controller';
import { MndExerciseStepService } from './mnd-exercise-step.service';
import { MndExerciseService } from './mnd-exercise.service';
import { MndMasterStackController } from './mnd-master-stack.controller';
import { MndMasterStackService } from './mnd-master-stack.service';
import { MndMatrixRuleController } from './mnd-matrix-rule.controller';
import { MndMatrixRuleService } from './mnd-matrix-rule.service';
import { MndSeedService } from './mnd-seed.service';
import { MndSymptomController } from './mnd-symptom.controller';
import { MndSymptomService } from './mnd-symptom.service';
import { MndExerciseBlockRepository } from './repositories/mnd-exercise-block.repository';
import { MndExerciseRepository } from './repositories/mnd-exercise.repository';
import { MndExerciseStepRepository } from './repositories/mnd-exercise-step.repository';
import { MndMasterStackRepository } from './repositories/mnd-master-stack.repository';
import { MndMatrixRuleRepository } from './repositories/mnd-matrix-rule.repository';
import { MndSymptomRepository } from './repositories/mnd-symptom.repository';
import { MndSessionGeneratorService } from './mnd-session-generator.service';

@Module({
  imports: [
    AnalyticsModule,
    TypeOrmModule.forFeature([
      MndExercise,
      MndExerciseBlock,
      MndExerciseStep,
      MndMasterStack,
      MndMatrixRule,
      MndMatrixRuleStack,
      MndSymptom,
    ]),
  ],
  controllers: [
    MndExerciseController,
    MndExerciseStepController,
    MndMasterStackController,
    MndMatrixRuleController,
    MndSymptomController,
  ],
  providers: [
    MndExerciseBlockRepository,
    MndExerciseRepository,
    MndExerciseStepRepository,
    MndExerciseStepService,
    MndExerciseService,
    MndMasterStackRepository,
    MndMasterStackService,
    MndMatrixRuleRepository,
    MndMatrixRuleService,
    MndSeedService,
    MndSessionGeneratorService,
    MndSymptomRepository,
    MndSymptomService,
  ],
  exports: [
    MndExerciseService,
    MndMasterStackService,
    MndMatrixRuleService,
    MndSessionGeneratorService,
    MndSymptomService,
  ],
})
export class MndModule {}
