import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { SignOptions } from 'jsonwebtoken';
import { AdminJoinRequest } from '../common/entity/admin-join-request.entity';
import { AdminUser } from '../common/entity/admin-user.entity';
import { JWT_ENV_KEYS } from '../common/constants/jwt-env-keys.constant';
import { AdminJoinRequestRepository } from './admin-join-request.repository';
import { AdminUserRepository } from './admin-user.repository';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BootstrapAdminService } from './bootstrap-admin.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminUser, AdminJoinRequest]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>(JWT_ENV_KEYS.SECRET),
        signOptions: {
          expiresIn: (configService.get<string>(JWT_ENV_KEYS.EXPIRES_IN) ??
            '7d') as SignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AdminUserRepository,
    AdminJoinRequestRepository,
    AuthService,
    JwtStrategy,
    BootstrapAdminService,
  ],
  exports: [AdminUserRepository, AdminJoinRequestRepository, JwtModule],
})
export class AuthModule {}
