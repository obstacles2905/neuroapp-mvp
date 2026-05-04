import { ApiProperty } from '@nestjs/swagger';
import { AdminJoinRequestStatus } from '../../common/enums/admin-join-request-status.enum';

export class AccessRequestRowDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ nullable: true })
  displayName: string | null;

  @ApiProperty({ nullable: true })
  message: string | null;

  @ApiProperty({ enum: AdminJoinRequestStatus })
  status: AdminJoinRequestStatus;

  @ApiProperty()
  createdAt: string;
}
