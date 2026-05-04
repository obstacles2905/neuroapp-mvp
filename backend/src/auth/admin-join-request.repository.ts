import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminJoinRequest } from '../common/entity/admin-join-request.entity';
import { AdminJoinRequestStatus } from '../common/enums/admin-join-request-status.enum';

@Injectable()
export class AdminJoinRequestRepository {
  constructor(
    @InjectRepository(AdminJoinRequest)
    private readonly repository: Repository<AdminJoinRequest>,
  ) {}

  existsPendingByEmail(email: string): Promise<boolean> {
    return this.repository.exists({
      where: { email, status: AdminJoinRequestStatus.PENDING },
    });
  }

  findById(id: string): Promise<AdminJoinRequest | null> {
    return this.repository.findOne({ where: { id } });
  }

  findAllByStatus(status: AdminJoinRequestStatus): Promise<AdminJoinRequest[]> {
    return this.repository.find({
      where: { status },
      order: { createdAt: 'ASC' },
    });
  }

  save(entity: AdminJoinRequest): Promise<AdminJoinRequest> {
    return this.repository.save(entity);
  }

  create(data: Partial<AdminJoinRequest>): AdminJoinRequest {
    return this.repository.create(data);
  }
}
