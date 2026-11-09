import { Permission } from '../../auth/domain/permission';
import { VideoStatus } from './video-status';

export interface VideoActor {
  id: string;
  permissions: readonly string[];
}

export function canView(
  actor: VideoActor,
  video: { ownerId: string; status: VideoStatus },
): boolean {
  if (actor.permissions.includes(Permission.VideoRetry)) {
    return true;
  }
  if (video.status === VideoStatus.Done) {
    return actor.permissions.includes(Permission.VideoRead);
  }
  return (
    actor.permissions.includes(Permission.VideoUpload) &&
    video.ownerId === actor.id
  );
}

export function canDelete(
  actor: VideoActor,
  video: { ownerId: string },
): boolean {
  if (actor.permissions.includes(Permission.UserManage)) {
    return true;
  }
  return (
    actor.permissions.includes(Permission.VideoDelete) &&
    video.ownerId === actor.id
  );
}
