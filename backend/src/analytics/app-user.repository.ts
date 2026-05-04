import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppUser } from '../common/entity/app-user.entity';

@Injectable()
export class AppUserRepository {
  constructor(
    @InjectRepository(AppUser)
    private readonly repository: Repository<AppUser>,
  ) {}

  findAllWithProgress(): Promise<AppUser[]> {
    return this.repository.find({
      relations: { progress: true },
      order: { createdAt: 'DESC' },
    });
  }

  findByIdWithProgressAndLessons(id: string): Promise<AppUser | null> {
    return this.repository.findOne({
      where: { id },
      relations: { progress: { lesson: true } },
    });
  }

  findById(id: string): Promise<AppUser | null> {
    return this.repository.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<AppUser | null> {
    return this.repository.findOne({
      where: { email: email.toLowerCase().trim() },
    });
  }

  findByEmailForAuth(email: string): Promise<AppUser | null> {
    return this.repository.findOne({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        displayName: true,
        passwordHash: true,
        externalId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  save(entity: AppUser): Promise<AppUser> {
    return this.repository.save(entity);
  }

  create(partial: Partial<AppUser>): AppUser {
    return this.repository.create(partial);
  }
}
