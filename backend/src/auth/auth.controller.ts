import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '../common/types/request-user.type';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthTokensResponseDto } from './dto/auth-tokens-response.dto';
import { JoinRequestDto } from './dto/join-request.dto';
import { LoginDto } from './dto/login.dto';
import { MeResponseDto } from './dto/me-response.dto';

@ApiTags('auth')
@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login (JWT)' })
  @ApiResponse({ status: HttpStatus.OK, type: AuthTokensResponseDto })
  login(@Body() dto: LoginDto): Promise<AuthTokensResponseDto> {
    return this.authService.login(dto.email, dto.password);
  }

  @Public()
  @Post('join-request')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Request admin access (pending super admin approval)',
  })
  async joinRequest(@Body() dto: JoinRequestDto): Promise<void> {
    await this.authService.submitJoinRequest(dto);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Current admin user' })
  me(@CurrentUser() user: User): Promise<MeResponseDto> {
    return this.authService.me(user.id);
  }
}
