import { ApiProperty } from '@nestjs/swagger';
import { AdminRole } from '../../common/enums/admin-role.enum';

export class MeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ nullable: true })
  displayName: string | null;

  @ApiProperty({ enum: AdminRole })
  role: AdminRole;
}
