import { SetMetadata } from '@nestjs/common';
import { AdminRole } from '../../common/enums/admin-role.enum';
import { ROLES_KEY } from '../constants/auth-metadata.constant';

export const Roles = (...roles: AdminRole[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(ROLES_KEY, roles);
