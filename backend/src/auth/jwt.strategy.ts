import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_ENV_KEYS } from '../common/constants/jwt-env-keys.constant';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import type { User } from '../common/types/request-user.type';
import { AdminUserRepository } from './admin-user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly adminUserRepository: AdminUserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>(JWT_ENV_KEYS.SECRET),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.adminUserRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return { id: user.id, email: user.email, role: user.role };
  }
}
