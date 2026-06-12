import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AppUserDetailResponseDto } from './dto/app-user-detail-response.dto';
import { AppUserSummaryResponseDto } from './dto/app-user-summary-response.dto';

@ApiTags('analytics')
@ApiBearerAuth('access-token')
@Controller('admin/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('users')
  @ApiOperation({ summary: 'List app users with MND progress summary' })
  listUsers(): Promise<AppUserSummaryResponseDto[]> {
    return this.analyticsService.listUsers();
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'App user detail with MND progress and usage' })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Начало периода (локальный день YYYY-MM-DD пользователя)',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'Конец периода (локальный день YYYY-MM-DD пользователя)',
  })
  getUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<AppUserDetailResponseDto> {
    return this.analyticsService.getUserDetail(id, from, to);
  }
}
