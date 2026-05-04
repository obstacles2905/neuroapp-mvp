import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminJoinRequestStatus } from '../enums/admin-join-request-status.enum';

@Entity({ name: 'admin_join_requests' })
export class AdminJoinRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 320 })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({
    name: 'display_name',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  displayName: string | null;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({
    type: 'enum',
    enum: AdminJoinRequestStatus,
    default: AdminJoinRequestStatus.PENDING,
  })
  status: AdminJoinRequestStatus;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ name: 'reviewed_by_admin_id', type: 'uuid', nullable: true })
  reviewedByAdminId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
