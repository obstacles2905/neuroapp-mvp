import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArchitectWordModule } from './architect-word/architect-word.module';
import { AccessRequestModule } from './access-request/access-request.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppAuthModule } from './app-auth/app-auth.module';
import { ActivityStreakModule } from './activity-streak/activity-streak.module';
import { AppOnboardingModule } from './app-onboarding/app-onboarding.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  AdminJoinRequest,
  AdminUser,
  ArchitectWordVideo,
  AppUserMndExerciseCompletion,
  AppUserMndJamExerciseDayCompletion,
  AppUserUsageDaily,
  AppUserUsageSegment,
  AppUserVoiceMeasurementSession,
  AppUser,
  MndExercise,
  MndExerciseBlock,
  MndExerciseStep,
  MndMasterStack,
  MndMatrixRule,
  MndMatrixRuleStack,
  MndSymptom,
} from './common/entity';
import { buildTypeOrmOptions } from './common/helpers/build-typeorm-options.helper';
import { MediaModule } from './media/media.module';
import { MndModule } from './mnd/mnd.module';
import { UsageTrackingModule } from './usage-tracking/usage-tracking.module';
import { VoiceMeasurementModule } from './voice-measurement/voice-measurement.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        buildTypeOrmOptions(configService, [
          AdminJoinRequest,
          AdminUser,
          ArchitectWordVideo,
          AppUserMndExerciseCompletion,
          AppUserMndJamExerciseDayCompletion,
          AppUserUsageDaily,
          AppUserUsageSegment,
          AppUserVoiceMeasurementSession,
          AppUser,
          MndExercise,
          MndExerciseBlock,
          MndExerciseStep,
          MndMasterStack,
          MndMatrixRule,
          MndMatrixRuleStack,
          MndSymptom,
        ]),
    }),
    AuthModule,
    AppAuthModule,
    AppOnboardingModule,
    ActivityStreakModule,
    AccessRequestModule,
    ArchitectWordModule,
    MediaModule,
    MndModule,
    AnalyticsModule,
    UsageTrackingModule,
    VoiceMeasurementModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
