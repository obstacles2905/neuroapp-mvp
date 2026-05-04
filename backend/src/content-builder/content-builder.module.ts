import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category, Lesson, LessonBlock, LessonStep } from '../common/entity';
import { CategoryController } from './category/category.controller';
import { CategoryRepository } from './category/category.repository';
import { CategoryService } from './category/category.service';
import { LessonBlockRepository } from './lesson-block/lesson-block.repository';
import { LessonStepController } from './lesson-step/lesson-step.controller';
import { LessonStepRepository } from './lesson-step/lesson-step.repository';
import { LessonStepService } from './lesson-step/lesson-step.service';
import { LessonController } from './lesson/lesson.controller';
import { LessonRepository } from './lesson/lesson.repository';
import { LessonService } from './lesson/lesson.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Lesson, LessonBlock, LessonStep]),
  ],
  controllers: [CategoryController, LessonController, LessonStepController],
  providers: [
    CategoryRepository,
    CategoryService,
    LessonBlockRepository,
    LessonRepository,
    LessonService,
    LessonStepRepository,
    LessonStepService,
  ],
  exports: [
    CategoryRepository,
    CategoryService,
    LessonRepository,
    LessonService,
    LessonStepService,
  ],
})
export class ContentBuilderModule {}
