import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '../common/enums/admin-role.enum';
import type { User } from '../common/types/request-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AccessRequestService } from './access-request.service';
import { AccessRequestRowDto } from './dto/access-request-row.dto';

@ApiTags('access-requests')
@ApiBearerAuth('access-token')
@Controller('admin/access-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN)
export class AccessRequestController {
  constructor(private readonly accessRequestService: AccessRequestService) {}

  @Get()
  @ApiOperation({ summary: 'List pending join requests (super admin)' })
  listPending(): Promise<AccessRequestRowDto[]> {
    return this.accessRequestService.listPending();
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Approve join request and create content editor account',
  })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.accessRequestService.approve(id, user.id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reject join request' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.accessRequestService.reject(id, user.id);
  }
}
