import {
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Post,
  Query,
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
import { AppMndExerciseService } from './app-mnd-exercise.service';
import { AppMndExerciseDetailResponseDto } from './dto/app-mnd-exercise-detail-response.dto';

@ApiTags('app-mnd-exercise')
@Controller('app/mnd/exercises')
export class AppMndExerciseController {
  constructor(private readonly appMndExerciseService: AppMndExerciseService) {}

  @Public()
  @Get(':exerciseId')
  @UseGuards(AppJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Контент опубликованного MND-упражнения (блоки и шаги)' })
  getOne(
    @Param('exerciseId', ParseUUIDPipe) exerciseId: string,
  ): Promise<AppMndExerciseDetailResponseDto> {
    return this.appMndExerciseService.getPublishedDetail(exerciseId);
  }

  @Public()
  @Post(':exerciseId/complete')
  @UseGuards(AppJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Зафиксировать завершение упражнения (стрик активности за UTC-день, idempotent)',
  })
  async complete(
    @CurrentAppUser() user: RequestAppUser,
    @Param('exerciseId', ParseUUIDPipe) exerciseId: string,
    @Query('fromJam', new DefaultValuePipe(false), ParseBoolPipe)
    fromJam: boolean,
  ): Promise<void> {
    await this.appMndExerciseService.recordComplete(user.id, exerciseId, {
      fromJam,
    });
  }
}
