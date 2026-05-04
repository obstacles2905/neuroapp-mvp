import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AppUserDetailResponseDto } from './dto/app-user-detail-response.dto';
import { AppUserSummaryResponseDto } from './dto/app-user-summary-response.dto';

@ApiTags('analytics')
@ApiBearerAuth('access-token')
@Controller('admin/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('users')
  @ApiOperation({ summary: 'List app users with lesson progress summary' })
  listUsers(): Promise<AppUserSummaryResponseDto[]> {
    return this.analyticsService.listUsers();
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'App user detail with per-lesson progress' })
  getUser(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AppUserDetailResponseDto> {
    return this.analyticsService.getUserDetail(id);
  }
}
