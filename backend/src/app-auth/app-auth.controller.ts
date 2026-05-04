import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthTokensResponseDto } from '../auth/dto/auth-tokens-response.dto';
import { LoginDto } from '../auth/dto/login.dto';
import { Public } from '../auth/decorators/public.decorator';
import { AppRegisterDto } from './dto/app-register.dto';
import { AppMeResponseDto } from './dto/app-me-response.dto';
import { AppAuthService } from './app-auth.service';
import { AppJwtAuthGuard } from './guards/app-jwt-auth.guard';
import { CurrentAppUser } from './decorators/current-app-user.decorator';
import type { RequestAppUser } from '../common/types/request-app-user.type';

@ApiTags('app-auth')
@Controller('app/auth')
export class AppAuthController {
  constructor(private readonly appAuthService: AppAuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register app user' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AuthTokensResponseDto })
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: AppRegisterDto): Promise<AuthTokensResponseDto> {
    return this.appAuthService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login (JWT)' })
  @ApiResponse({ status: HttpStatus.OK, type: AuthTokensResponseDto })
  login(@Body() dto: LoginDto): Promise<AuthTokensResponseDto> {
    return this.appAuthService.login(dto.email, dto.password);
  }

  @Public()
  @Get('me')
  @UseGuards(AppJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Current app user' })
  me(@CurrentAppUser() user: RequestAppUser): Promise<AppMeResponseDto> {
    return this.appAuthService.me(user.id);
  }
}
