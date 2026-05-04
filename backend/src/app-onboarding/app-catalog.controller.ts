import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentAppUser } from '../app-auth/decorators/current-app-user.decorator';
import { AppJwtAuthGuard } from '../app-auth/guards/app-jwt-auth.guard';
import type { RequestAppUser } from '../common/types/request-app-user.type';
import { AppCatalogService } from './app-catalog.service';
import { AppLessonsService } from './app-lessons.service';
import { AppCategoryListItemResponseDto } from './dto/app-category-list-item-response.dto';
import { AppLessonListItemResponseDto } from './dto/app-lesson-list-item-response.dto';

@ApiTags('app-catalog')
@Controller('app/categories')
export class AppCatalogController {
  constructor(
    private readonly appCatalogService: AppCatalogService,
    private readonly appLessonsService: AppLessonsService,
  ) {}

  @Public()
  @Get()
  @UseGuards(AppJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Категории в основном каталоге (для онбординга / учёбы)' })
  list(@CurrentAppUser() user: RequestAppUser): Promise<AppCategoryListItemResponseDto[]> {
    return this.appCatalogService.listPublishedCategoriesForUser(user.id);
  }

  @Public()
  @Get(':categoryId/lessons')
  @UseGuards(AppJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Опубликованные уроки категории (с прогрессом)' })
  listLessons(
    @CurrentAppUser() user: RequestAppUser,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ): Promise<AppLessonListItemResponseDto[]> {
    return this.appLessonsService.listByCategory(user.id, categoryId);
  }
}
