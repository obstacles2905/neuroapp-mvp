import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from '../common/entity/admin-user.entity';
import { AdminRole } from '../common/enums/admin-role.enum';

@Injectable()
export class AdminUserRepository {
  constructor(
    @InjectRepository(AdminUser)
    private readonly repository: Repository<AdminUser>,
  ) {}

  findByEmail(email: string): Promise<AdminUser | null> {
    return this.repository.findOne({ where: { email } });
  }

  findById(id: string): Promise<AdminUser | null> {
    return this.repository.findOne({ where: { id } });
  }

  existsWithEmail(email: string): Promise<boolean> {
    return this.repository.exists({ where: { email } });
  }

  existsSuperAdmin(): Promise<boolean> {
    return this.repository.exists({ where: { role: AdminRole.SUPER_ADMIN } });
  }

  save(entity: AdminUser): Promise<AdminUser> {
    return this.repository.save(entity);
  }

  create(data: Partial<AdminUser>): AdminUser {
    return this.repository.create(data);
  }
}
