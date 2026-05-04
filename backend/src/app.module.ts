import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessRequestModule } from './access-request/access-request.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppAuthModule } from './app-auth/app-auth.module';
import { ActivityStreakModule } from './activity-streak/activity-streak.module';
import { AppOnboardingModule } from './app-onboarding/app-onboarding.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContentBuilderModule } from './content-builder/content-builder.module';
import {
  AdminJoinRequest,
  AdminUser,
  AppUserMndExerciseCompletion,
  AppUserMndJamExerciseDayCompletion,
  AppUser,
  Category,
  Lesson,
  LessonBlock,
  LessonStep,
  MndExercise,
  MndExerciseBlock,
  MndExerciseStep,
  MndMasterStack,
  MndMatrixRule,
  MndMatrixRuleStack,
  MndSymptom,
  UserLessonProgress,
} from './common/entity';
import { readTrimmedConfigString } from './common/helpers/read-trimmed-config-string.helper';
import { MediaModule } from './media/media.module';
import { MndModule } from './mnd/mnd.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: readTrimmedConfigString(
          configService,
          'DATABASE_HOST',
          '127.0.0.1',
        ),
        port: Number.parseInt(
          readTrimmedConfigString(configService, 'DATABASE_PORT', '5432'),
          10,
        ),
        username: readTrimmedConfigString(
          configService,
          'DATABASE_USER',
          'neurosync',
        ),
        password: readTrimmedConfigString(
          configService,
          'DATABASE_PASSWORD',
          'neurosync_dev',
        ),
        database: readTrimmedConfigString(
          configService,
          'DATABASE_NAME',
          'neurosync',
        ),
        entities: [
          AdminJoinRequest,
          AdminUser,
          AppUserMndExerciseCompletion,
          AppUserMndJamExerciseDayCompletion,
          AppUser,
          Category,
          Lesson,
          LessonBlock,
          LessonStep,
          MndExercise,
          MndExerciseBlock,
          MndExerciseStep,
          MndMasterStack,
          MndMatrixRule,
          MndMatrixRuleStack,
          MndSymptom,
          UserLessonProgress,
        ],
        synchronize:
          readTrimmedConfigString(configService, 'DATABASE_SYNC', 'false') ===
          'true',
        logging:
          readTrimmedConfigString(
            configService,
            'DATABASE_LOGGING',
            'false',
          ) === 'true',
      }),
    }),
    AuthModule,
    AppAuthModule,
    AppOnboardingModule,
    ActivityStreakModule,
    AccessRequestModule,
    MediaModule,
    MndModule,
    ContentBuilderModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
