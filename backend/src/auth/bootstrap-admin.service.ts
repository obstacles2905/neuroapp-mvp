import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { BOOTSTRAP_ADMIN_ENV_KEYS } from '../common/constants/bootstrap-admin-env-keys.constant';
import { AdminRole } from '../common/enums/admin-role.enum';
import { AdminUserRepository } from './admin-user.repository';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class BootstrapAdminService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapAdminService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly adminUserRepository: AdminUserRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    const email = this.configService
      .get<string>(BOOTSTRAP_ADMIN_ENV_KEYS.EMAIL)
      ?.trim();
    const password = this.configService.get<string>(
      BOOTSTRAP_ADMIN_ENV_KEYS.PASSWORD,
    );
    if (!email || !password) {
      return;
    }
    const exists = await this.adminUserRepository.existsWithEmail(email);
    if (exists) {
      return;
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = this.adminUserRepository.create({
      email,
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
      displayName: 'Super Admin',
    });
    await this.adminUserRepository.save(user);
    this.logger.log(`Bootstrap super admin created for ${email}`);
  }
}
