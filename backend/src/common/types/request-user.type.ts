import type { AdminRole } from '../enums/admin-role.enum';

export type User = {
  id: string;
  email: string;
  role: AdminRole;
};
