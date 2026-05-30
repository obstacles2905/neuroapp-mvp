import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppUserVoiceMeasurementSession } from '../common/entity/app-user-voice-measurement-session.entity';
import { VoiceMeasurementController } from './voice-measurement.controller';
import { VoiceMeasurementService } from './voice-measurement.service';

@Module({
  controllers: [VoiceMeasurementController],
  exports: [VoiceMeasurementService],
  imports: [TypeOrmModule.forFeature([AppUserVoiceMeasurementSession])],
  providers: [VoiceMeasurementService],
})
export class VoiceMeasurementModule {}
