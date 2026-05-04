import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminJoinRequestStatus } from '../common/enums/admin-join-request-status.enum';
import { AdminRole } from '../common/enums/admin-role.enum';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { AdminJoinRequestRepository } from './admin-join-request.repository';
import { AdminUserRepository } from './admin-user.repository';
import { AuthTokensResponseDto } from './dto/auth-tokens-response.dto';
import { JoinRequestDto } from './dto/join-request.dto';
import { MeResponseDto } from './dto/me-response.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly adminUserRepository: AdminUserRepository,
    private readonly joinRequestRepository: AdminJoinRequestRepository,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<MeResponseDto> {
    const user = await this.adminUserRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.toMe(user);
  }

  async login(email: string, password: string): Promise<AuthTokensResponseDto> {
    const me = await this.validateUser(email, password);
    const payload: JwtPayload = {
      sub: me.id,
      email: me.email,
      role: me.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken, tokenType: 'Bearer' };
  }

  async me(userId: string): Promise<MeResponseDto> {
    const user = await this.adminUserRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.toMe(user);
  }

  async submitJoinRequest(dto: JoinRequestDto): Promise<void> {
    const email = dto.email.toLowerCase().trim();
    const taken = await this.adminUserRepository.existsWithEmail(email);
    if (taken) {
      throw new ConflictException('Email already registered');
    }
    const pending =
      await this.joinRequestRepository.existsPendingByEmail(email);
    if (pending) {
      throw new ConflictException('Request already pending for this email');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const entity = this.joinRequestRepository.create({
      email,
      passwordHash,
      displayName: dto.displayName ?? null,
      message: dto.message ?? null,
      status: AdminJoinRequestStatus.PENDING,
    });
    await this.joinRequestRepository.save(entity);
  }

  private toMe(user: {
    id: string;
    email: string;
    displayName: string | null;
    role: AdminRole;
  }): MeResponseDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
  }
}
