import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentAppUser } from '../app-auth/decorators/current-app-user.decorator';
import { AppJwtAuthGuard } from '../app-auth/guards/app-jwt-auth.guard';
import type { RequestAppUser } from '../common/types/request-app-user.type';
import { SubmitUsageSegmentsDto } from './dto/submit-usage-segments.dto';
import { UsageTrackingService } from './usage-tracking.service';

@ApiTags('app-usage')
@Controller('app/usage')
export class UsageTrackingController {
  constructor(private readonly usageTrackingService: UsageTrackingService) {}

  @Public()
  @Post('segments')
  @UseGuards(AppJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Отправить интервалы времени в приложении и на упражнениях (идемпотентно)',
  })
  async submitSegments(
    @CurrentAppUser() user: RequestAppUser,
    @Body() body: SubmitUsageSegmentsDto,
  ): Promise<void> {
    await this.usageTrackingService.submitSegments(user.id, body);
  }
}
