import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AppUserRepository } from '../analytics/app-user.repository';
import { AuthTokensResponseDto } from '../auth/dto/auth-tokens-response.dto';
import type { AppJwtPayload } from '../common/interfaces/app-jwt-payload.interface';
import { buildPrioritizedCategoryIdsFromRanks } from '../common/helpers/build-prioritized-category-ids-from-ranks.helper';
import { buildPrioritizedSymptomIdsFromRanks } from '../common/helpers/build-prioritized-symptom-ids-from-ranks.helper';
import { AppRegisterDto } from './dto/app-register.dto';
import { AppMeResponseDto } from './dto/app-me-response.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AppAuthService {
  constructor(
    private readonly appUserRepository: AppUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: AppRegisterDto): Promise<AuthTokensResponseDto> {
    const email = dto.email.toLowerCase().trim();
    const taken = await this.appUserRepository.findByEmail(email);
    if (taken) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const entity = this.appUserRepository.create({
      email,
      displayName: dto.displayName.trim(),
      passwordHash,
    });
    const user = await this.appUserRepository.save(entity);
    return this.issueToken(user.id, user.email!);
  }

  async login(email: string, password: string): Promise<AuthTokensResponseDto> {
    const user = await this.appUserRepository.findByEmailForAuth(
      email.toLowerCase().trim(),
    );
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueToken(user.id, user.email!);
  }

  async me(userId: string): Promise<AppMeResponseDto> {
    const user = await this.appUserRepository.findById(userId);
    if (!user?.email) {
      throw new UnauthorizedException();
    }
    const completed = user.onboardingCompletedAt;
    const skipped = user.onboardingSkippedAt;
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      onboardingCompletedAt: completed ? completed.toISOString() : null,
      onboardingSkippedAt: skipped ? skipped.toISOString() : null,
      prioritizedCategoryIds: buildPrioritizedCategoryIdsFromRanks(
        user.onboardingCategoryRanks,
      ),
      prioritizedSymptomIds: buildPrioritizedSymptomIdsFromRanks(
        user.onboardingSymptomRanks,
      ),
      needsOnboarding: completed === null && skipped === null,
      activityStreakCount: user.activityStreakCount,
      activityStreakLastUtcDate: user.activityStreakLastUtcDate,
    };
  }

  private async issueToken(
    sub: string,
    email: string,
  ): Promise<AuthTokensResponseDto> {
    const payload: AppJwtPayload = { sub, email, typ: 'app' };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken, tokenType: 'Bearer' };
  }
}
