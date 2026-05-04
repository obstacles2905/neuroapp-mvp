import type { AdminRole } from '../common/enums/admin-role.enum';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: AdminRole;
    }
  }
}

export {};
