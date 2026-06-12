import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { AppJwtAuthGuard } from '../app-auth/guards/app-jwt-auth.guard';
import { CurrentAppUser } from '../app-auth/decorators/current-app-user.decorator';
import type { RequestAppUser } from '../common/types/request-app-user.type';
import { ArchitectWordService } from './architect-word.service';
import { ArchitectWordPresentationResponseDto } from './dto/architect-word-presentation-response.dto';

@ApiTags('app-architect-word')
@Controller('app/architect-word')
export class ArchitectWordAppController {
  constructor(private readonly architectWordService: ArchitectWordService) {}

  @Public()
  @Get('presentation')
  @UseGuards(AppJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiQuery({
    name: 'replay',
    required: false,
    description: 'true — новый случайный порядок блоков (тест / профиль)',
  })
  @ApiOperation({
    summary: 'Плейлист «Слово Архитектора» по приоритетным симптомам пользователя',
  })
  getPresentation(
    @CurrentAppUser() user: RequestAppUser,
    @Query('replay') replayRaw?: string,
  ): Promise<ArchitectWordPresentationResponseDto> {
    const replay = replayRaw === 'true' || replayRaw === '1';
    return this.architectWordService.getPresentationForUser(user.id, replay);
  }

  @Public()
  @Post('complete')
  @UseGuards(AppJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Отметить первичный просмотр «Слово Архитектора» завершённым',
  })
  complete(@CurrentAppUser() user: RequestAppUser): Promise<void> {
    return this.architectWordService.completeForUser(user.id);
  }
}
