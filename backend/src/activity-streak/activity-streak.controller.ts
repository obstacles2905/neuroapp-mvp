import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentAppUser } from '../app-auth/decorators/current-app-user.decorator';
import { AppJwtAuthGuard } from '../app-auth/guards/app-jwt-auth.guard';
import type { RequestAppUser } from '../common/types/request-app-user.type';
import { ActivityStreakService } from './activity-streak.service';
import { ActivityCalendarResponseDto } from './dto/activity-calendar-response.dto';

@ApiTags('app-activity')
@Controller('app/activity')
export class ActivityStreakController {
  constructor(private readonly activityStreakService: ActivityStreakService) {}

  @Public()
  @Get('calendar')
  @UseGuards(AppJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiQuery({ name: 'year', type: Number, example: 2026 })
  @ApiQuery({ name: 'month', type: Number, example: 4, description: '1–12' })
  @ApiOperation({
    summary: 'Календарь завершённых уроков (UTC) за месяц',
  })
  getCalendar(
    @CurrentAppUser() user: RequestAppUser,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ): Promise<ActivityCalendarResponseDto> {
    return this.activityStreakService.getActivityCalendar(user.id, year, month);
  }

  @Public()
  @Post('streak/reset')
  @UseGuards(AppJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Сбросить стрик (для тестов/QA, только свой аккаунт)' })
  resetStreak(@CurrentAppUser() user: RequestAppUser): Promise<void> {
    return this.activityStreakService.resetStreakTest(user.id);
  }
}
