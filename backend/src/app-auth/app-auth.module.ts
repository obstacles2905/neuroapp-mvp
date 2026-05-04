import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuthModule } from '../auth/auth.module';
import { AppAuthController } from './app-auth.controller';
import { AppAuthService } from './app-auth.service';
import { AppJwtStrategy } from './app-jwt.strategy';
import { AppJwtAuthGuard } from './guards/app-jwt-auth.guard';

@Module({
  imports: [AnalyticsModule, AuthModule, PassportModule],
  controllers: [AppAuthController],
  providers: [AppAuthService, AppJwtStrategy, AppJwtAuthGuard],
  exports: [PassportModule, AppJwtStrategy, AppJwtAuthGuard],
})
export class AppAuthModule {}
