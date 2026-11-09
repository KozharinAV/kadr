import { Permission } from '../../auth/domain/permission';
import { RoleName } from '../../auth/domain/role-name';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: RoleName;
  permissions: Permission[];
}

export interface NewUser {
  email: string;
  passwordHash: string;
  role: RoleName;
}

export interface UserChange {
  email: string;
  role: RoleName;
  passwordHash?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: RoleName;
  permissions: Permission[];
}

export function toProfile(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
  };
}
