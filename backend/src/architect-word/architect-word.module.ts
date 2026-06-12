import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ArchitectWordVideo } from '../common/entity/architect-word-video.entity';
import { MediaModule } from '../media/media.module';
import { MndModule } from '../mnd/mnd.module';
import { ArchitectWordAdminController } from './architect-word-admin.controller';
import { ArchitectWordAppController } from './architect-word-app.controller';
import { ArchitectWordRepository } from './architect-word.repository';
import { ArchitectWordService } from './architect-word.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArchitectWordVideo]),
    AnalyticsModule,
    MndModule,
    MediaModule,
  ],
  controllers: [ArchitectWordAdminController, ArchitectWordAppController],
  providers: [ArchitectWordRepository, ArchitectWordService],
  exports: [ArchitectWordService],
})
export class ArchitectWordModule {}
