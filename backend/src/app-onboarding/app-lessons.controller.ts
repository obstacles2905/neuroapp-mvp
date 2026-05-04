import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentAppUser } from '../app-auth/decorators/current-app-user.decorator';
import { AppJwtAuthGuard } from '../app-auth/guards/app-jwt-auth.guard';
import type { RequestAppUser } from '../common/types/request-app-user.type';
import { AppLessonsService } from './app-lessons.service';
import { AppLessonDetailResponseDto } from './dto/app-lesson-detail-response.dto';
import { AppLessonProgressSnapshotResponseDto } from './dto/app-lesson-progress-snapshot-response.dto';
import { UpdateAppLessonProgressDto } from './dto/update-app-lesson-progress.dto';

@ApiTags('app-lessons')
@Controller('app/lessons')
export class AppLessonsController {
  constructor(private readonly appLessonsService: AppLessonsService) {}

  @Public()
  @Get(':id')
  @UseGuards(AppJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Урок с блоками и шагами (только published)' })
  getOne(
    @CurrentAppUser() user: RequestAppUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AppLessonDetailResponseDto> {
    return this.appLessonsService.getById(user.id, id);
  }

  @Public()
  @Patch(':id/progress')
  @UseGuards(AppJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Обновить прогресс по уроку' })
  updateProgress(
    @CurrentAppUser() user: RequestAppUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppLessonProgressDto,
  ): Promise<AppLessonProgressSnapshotResponseDto> {
    return this.appLessonsService.updateProgress(user.id, id, dto);
  }
}
