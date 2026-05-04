import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppUserRepository } from '../analytics/app-user.repository';
import { JWT_ENV_KEYS } from '../common/constants/jwt-env-keys.constant';
import type { AppJwtPayload } from '../common/interfaces/app-jwt-payload.interface';
import type { RequestAppUser } from '../common/types/request-app-user.type';

@Injectable()
export class AppJwtStrategy extends PassportStrategy(Strategy, 'app-jwt') {
  constructor(
    configService: ConfigService,
    private readonly appUserRepository: AppUserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>(JWT_ENV_KEYS.SECRET),
    });
  }

  async validate(payload: AppJwtPayload): Promise<RequestAppUser> {
    if (payload.typ !== 'app') {
      throw new UnauthorizedException();
    }
    const user = await this.appUserRepository.findById(payload.sub);
    if (!user?.email) {
      throw new UnauthorizedException();
    }
    return { id: user.id, email: user.email, displayName: user.displayName };
  }
}
