import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { AppJwtAuthGuard } from '../app-auth/guards/app-jwt-auth.guard';
import { CurrentAppUser } from '../app-auth/decorators/current-app-user.decorator';
import type { RequestAppUser } from '../common/types/request-app-user.type';
import { AppDailyMndSessionResponseDto } from './dto/app-daily-mnd-session-response.dto';
import { AppMndSosSessionRequestDto } from './dto/app-mnd-sos-session-request.dto';
import { MndSessionGeneratorService } from '../mnd/mnd-session-generator.service';

@ApiTags('app-mnd-session')
@Controller('app/mnd/session')
export class AppMndSessionController {
  constructor(
    private readonly mndSessionGeneratorService: MndSessionGeneratorService,
  ) {}

  @Public()
  @Get('daily')
  @UseGuards(AppJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Сгенерировать дневную MND-сессию (упражнения по симптомам и матрице)',
  })
  daily(
    @CurrentAppUser() user: RequestAppUser,
  ): Promise<AppDailyMndSessionResponseDto> {
    return this.mndSessionGeneratorService.buildDailySessionForUser(user.id);
  }

  @Public()
  @Post('sos')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AppJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Короткая SOS-сессия (2–3 упражнения) по одному выбранному симптому сейчас',
  })
  sos(
    @CurrentAppUser() user: RequestAppUser,
    @Body() body: AppMndSosSessionRequestDto,
  ): Promise<AppDailyMndSessionResponseDto> {
    return this.mndSessionGeneratorService.buildSosSessionForUser(
      user.id,
      body.symptomId,
    );
  }

  @Public()
  @Get('jam')
  @UseGuards(AppJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Джем-сессия: упражнения только из уже завершённых (повторение по вашим симптомам)',
  })
  jam(
    @CurrentAppUser() user: RequestAppUser,
  ): Promise<AppDailyMndSessionResponseDto> {
    return this.mndSessionGeneratorService.buildJamSessionForUser(user.id);
  }
}
