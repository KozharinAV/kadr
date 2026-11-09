export enum Permission {
  VideoRead = 'video.read',
  VideoUpload = 'video.upload',
  VideoDelete = 'video.delete',
  VideoRetry = 'video.retry',
  UserManage = 'user.manage',
}

const PERMISSION_VALUES = new Set<string>(Object.values(Permission));

export function isPermission(value: string): value is Permission {
  return PERMISSION_VALUES.has(value);
}
