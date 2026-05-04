import type { AdminRole } from '../enums/admin-role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: AdminRole;
}
