import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdminJoinRequest } from '../common/entity/admin-join-request.entity';
import { AdminUser } from '../common/entity/admin-user.entity';
import { AdminJoinRequestStatus } from '../common/enums/admin-join-request-status.enum';
import { AdminRole } from '../common/enums/admin-role.enum';
import { AdminJoinRequestRepository } from '../auth/admin-join-request.repository';
import { AdminUserRepository } from '../auth/admin-user.repository';
import { AccessRequestRowDto } from './dto/access-request-row.dto';

@Injectable()
export class AccessRequestService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly joinRequestRepository: AdminJoinRequestRepository,
    private readonly adminUserRepository: AdminUserRepository,
  ) {}

  listPending(): Promise<AccessRequestRowDto[]> {
    return this.mapRows(
      this.joinRequestRepository.findAllByStatus(
        AdminJoinRequestStatus.PENDING,
      ),
    );
  }

  async approve(requestId: string, reviewerAdminId: string): Promise<void> {
    const request = await this.requirePendingRequest(requestId);
    const emailTaken = await this.adminUserRepository.existsWithEmail(
      request.email,
    );
    if (emailTaken) {
      throw new ConflictException('Admin with this email already exists');
    }
    await this.dataSource.transaction(async (manager) => {
      const adminRepo = manager.getRepository(AdminUser);
      const joinRepo = manager.getRepository(AdminJoinRequest);
      const admin = adminRepo.create({
        email: request.email,
        passwordHash: request.passwordHash,
        displayName: request.displayName,
        role: AdminRole.CONTENT_EDITOR,
      });
      await adminRepo.save(admin);
      request.status = AdminJoinRequestStatus.APPROVED;
      request.reviewedAt = new Date();
      request.reviewedByAdminId = reviewerAdminId;
      await joinRepo.save(request);
    });
  }

  async reject(requestId: string, reviewerAdminId: string): Promise<void> {
    const request = await this.requirePendingRequest(requestId);
    await this.finalizeRequest(
      request,
      AdminJoinRequestStatus.REJECTED,
      reviewerAdminId,
    );
  }

  private async requirePendingRequest(id: string): Promise<AdminJoinRequest> {
    const request = await this.joinRequestRepository.findById(id);
    if (!request || request.status !== AdminJoinRequestStatus.PENDING) {
      throw new NotFoundException(`Pending access request ${id} not found`);
    }
    return request;
  }

  private async finalizeRequest(
    request: AdminJoinRequest,
    status: AdminJoinRequestStatus,
    reviewerAdminId: string,
  ): Promise<void> {
    request.status = status;
    request.reviewedAt = new Date();
    request.reviewedByAdminId = reviewerAdminId;
    await this.joinRequestRepository.save(request);
  }

  private async mapRows(
    promise: Promise<AdminJoinRequest[]>,
  ): Promise<AccessRequestRowDto[]> {
    const rows = await promise;
    return rows.map((r) => this.toRow(r));
  }

  private toRow(r: AdminJoinRequest): AccessRequestRowDto {
    return {
      id: r.id,
      email: r.email,
      displayName: r.displayName,
      message: r.message,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
