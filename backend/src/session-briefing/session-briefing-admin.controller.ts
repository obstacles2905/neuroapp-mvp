import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionBriefingPhase } from '../common/enums/session-briefing-phase.enum';
import { SessionBriefingAdminResponseDto } from './dto/session-briefing-admin-response.dto';
import { UpsertSessionBriefingDto } from './dto/upsert-session-briefing.dto';
import { SessionBriefingService } from './session-briefing.service';

@ApiTags('session-briefing-admin')
@ApiBearerAuth('access-token')
@Controller('admin/session-briefing')
export class SessionBriefingAdminController {
  constructor(private readonly sessionBriefingService: SessionBriefingService) {}

  @Get(':phase')
  @ApiOperation({ summary: 'Видео «Приветствие» или «Финальное слово»' })
  getBriefing(
    @Param('phase') phaseRaw: string,
  ): Promise<SessionBriefingAdminResponseDto> {
    const phase = this.sessionBriefingService.assertValidPhase(phaseRaw);
    return this.sessionBriefingService.getAdminBriefing(phase);
  }

  @Put(':phase')
  @ApiOperation({ summary: 'Сохранить видео фазы' })
  upsertBriefing(
    @Param('phase') phaseRaw: string,
    @Body() dto: UpsertSessionBriefingDto,
  ): Promise<SessionBriefingAdminResponseDto> {
    const phase = this.sessionBriefingService.assertValidPhase(phaseRaw);
    return this.sessionBriefingService.upsertAdminBriefing(phase, dto);
  }

  @Delete(':phase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Очистить видео фазы' })
  clearBriefing(
    @Param('phase') phaseRaw: string,
  ): Promise<SessionBriefingAdminResponseDto> {
    const phase = this.sessionBriefingService.assertValidPhase(phaseRaw);
    return this.sessionBriefingService.clearAdminBriefing(phase);
  }
}
