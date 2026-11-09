import { Permission } from './permission';

export const ROLE_NAMES = ['admin', 'editor', 'viewer'] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

const ROLE_NAME_VALUES = new Set<string>(ROLE_NAMES);

export function isRoleName(value: string): value is RoleName {
  return ROLE_NAME_VALUES.has(value);
}

export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  admin: Object.values(Permission),
  editor: [
    Permission.VideoRead,
    Permission.VideoUpload,
    Permission.VideoDelete,
  ],
  viewer: [Permission.VideoRead],
};
