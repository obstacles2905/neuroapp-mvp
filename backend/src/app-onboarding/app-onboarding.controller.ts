import {
  Body,
  Controller,
  Get,
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
import { AppJwtAuthGuard } from '../app-auth/guards/app-jwt-auth.guard';
import { CurrentAppUser } from '../app-auth/decorators/current-app-user.decorator';
import type { RequestAppUser } from '../common/types/request-app-user.type';
import { AppOnboardingService } from './app-onboarding.service';
import { AppOnboardingSymptomListItemResponseDto } from './dto/app-onboarding-symptom-list-item-response.dto';
import { SubmitOnboardingDto } from './dto/submit-onboarding.dto';

@ApiTags('app-onboarding')
@Controller('app/onboarding')
export class AppOnboardingController {
  constructor(private readonly appOnboardingService: AppOnboardingService) {}

  @Public()
  @Get('symptoms')
  @UseGuards(AppJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Симптомы MND для онбординга (только опубликованные)',
  })
  listSymptoms(): Promise<AppOnboardingSymptomListItemResponseDto[]> {
    return this.appOnboardingService.listPublishedSymptoms();
  }

  @Public()
  @Post('complete')
  @UseGuards(AppJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Сохранить онбординг: упорядоченные id симптомов MND (1 — важнее, до 5 шт.)',
  })
  complete(
    @CurrentAppUser() user: RequestAppUser,
    @Body() dto: SubmitOnboardingDto,
  ): Promise<void> {
    return this.appOnboardingService.submit(user.id, dto);
  }

  @Public()
  @Post('replay')
  @UseGuards(AppJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Сбросить онбординг (для теста / повторного прохождения)' })
  replay(@CurrentAppUser() user: RequestAppUser): Promise<void> {
    return this.appOnboardingService.clearForReplay(user.id);
  }

  @Public()
  @Post('skip')
  @UseGuards(AppJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Пропустить онбординг сейчас (настройка приоритетов из профиля)',
  })
  skip(@CurrentAppUser() user: RequestAppUser): Promise<void> {
    return this.appOnboardingService.skip(user.id);
  }
}
