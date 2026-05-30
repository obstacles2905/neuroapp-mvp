import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentAppUser } from '../app-auth/decorators/current-app-user.decorator';
import { AppJwtAuthGuard } from '../app-auth/guards/app-jwt-auth.guard';
import type { RequestAppUser } from '../common/types/request-app-user.type';
import { SubmitVoiceMeasurementDto } from './dto/submit-voice-measurement.dto';
import { VoiceMeasurementService } from './voice-measurement.service';

@ApiTags('app-voice-measurements')
@Controller('app/voice-measurements')
export class VoiceMeasurementController {
  constructor(private readonly voiceMeasurementService: VoiceMeasurementService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AppJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Сохранить агрегаты голосового замера (идемпотентно по session id)',
  })
  submitAggregate(
    @CurrentAppUser() user: RequestAppUser,
    @Body() dto: SubmitVoiceMeasurementDto,
  ): Promise<void> {
    return this.voiceMeasurementService.upsertAggregate(user.id, dto);
  }
}
