import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppJwtAuthGuard } from '../app-auth/guards/app-jwt-auth.guard';
import { CurrentAppUser } from '../app-auth/decorators/current-app-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { RequestAppUser } from '../common/types/request-app-user.type';
import { SessionBriefingPresentationResponseDto } from './dto/session-briefing-presentation-response.dto';
import { SessionBriefingService } from './session-briefing.service';

@ApiTags('app-session-briefing')
@Controller('app/session-briefing')
export class SessionBriefingAppController {
  constructor(private readonly sessionBriefingService: SessionBriefingService) {}

  @Public()
  @Get(':phase/presentation')
  @UseGuards(AppJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Видео «Приветствие» или «Финальное слово» для приложения',
  })
  getPresentation(
    @CurrentAppUser() user: RequestAppUser,
    @Param('phase') phaseRaw: string,
  ): Promise<SessionBriefingPresentationResponseDto> {
    const phase = this.sessionBriefingService.assertValidPhase(phaseRaw);
    return this.sessionBriefingService.getPresentationForUser(user.id, phase);
  }

  @Public()
  @Post(':phase/complete')
  @UseGuards(AppJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Отметить просмотр «Приветствие» или «Финальное слово» завершённым',
  })
  complete(
    @CurrentAppUser() user: RequestAppUser,
    @Param('phase') phaseRaw: string,
  ): Promise<void> {
    const phase = this.sessionBriefingService.assertValidPhase(phaseRaw);
    return this.sessionBriefingService.completeForUser(user.id, phase);
  }
}
