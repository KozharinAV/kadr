import { Permission } from '../../auth/domain/permission';
import { canDelete, canView } from './video-access';
import { VideoStatus } from './video-status';

const ready = { ownerId: 'owner', status: VideoStatus.Done };
const processing = { ownerId: 'owner', status: VideoStatus.Processing };

describe('video access', () => {
  const viewer = { id: 'viewer', permissions: [Permission.VideoRead] };
  const editor = {
    id: 'owner',
    permissions: [
      Permission.VideoRead,
      Permission.VideoUpload,
      Permission.VideoDelete,
    ],
  };
  const admin = {
    id: 'admin',
    permissions: [
      Permission.VideoRead,
      Permission.VideoRetry,
      Permission.UserManage,
    ],
  };

  it('lets a viewer watch only finished videos', () => {
    expect(canView(viewer, ready)).toBe(true);
    expect(canView(viewer, processing)).toBe(false);
  });

  it('lets an editor follow their own unfinished video', () => {
    expect(canView(editor, processing)).toBe(true);
    expect(canView({ ...editor, id: 'other' }, processing)).toBe(false);
  });

  it('lets an admin see and delete any video', () => {
    expect(canView(admin, processing)).toBe(true);
    expect(canDelete(admin, { ownerId: 'owner' })).toBe(true);
  });

  it('lets an editor delete only their own video', () => {
    expect(canDelete(editor, { ownerId: 'owner' })).toBe(true);
    expect(canDelete({ ...editor, id: 'other' }, { ownerId: 'owner' })).toBe(
      false,
    );
  });
});
