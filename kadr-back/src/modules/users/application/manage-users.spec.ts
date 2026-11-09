import { ConflictException, ForbiddenException } from '@nestjs/common';
import { CreateUser } from './create-user';
import { DeleteUser } from './delete-user';
import { UpdateUser } from './update-user';
import { PasswordHasher } from '../../auth/application/password-hasher';
import { User } from '../domain/user';
import { UserRepository } from '../domain/user.repository';

const admin: User = {
  id: 'admin-1',
  email: 'admin@kadr.local',
  passwordHash: 'hash',
  role: 'admin',
  permissions: [],
};

describe('user administration', () => {
  const findByEmail = jest.fn<UserRepository['findByEmail']>();
  const findById = jest.fn<UserRepository['findById']>();
  const insert = jest.fn<UserRepository['insert']>();
  const update = jest.fn<UserRepository['update']>();
  const remove = jest.fn<UserRepository['delete']>();
  const countByRole = jest.fn<UserRepository['countByRole']>();
  const countOwnedVideos = jest.fn<UserRepository['countOwnedVideos']>();
  const users: UserRepository = {
    findByEmail,
    findById,
    list: jest.fn(),
    insert,
    update,
    delete: remove,
    countByRole,
    countOwnedVideos,
    upsertRole: jest.fn(),
    saveRefreshToken: jest.fn(),
    findRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
    revokeAllForUser: jest.fn(),
  };
  const passwords: PasswordHasher = {
    hash: jest.fn().mockResolvedValue('hashed'),
    verify: jest.fn(),
  };
  const createUser = new CreateUser(users, passwords);
  const updateUser = new UpdateUser(users, passwords);
  const deleteUser = new DeleteUser(users);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects a duplicate email', async () => {
    findByEmail.mockResolvedValue(admin);

    await expect(
      createUser.execute({
        email: 'Admin@Kadr.Local',
        password: 'Admin123!',
        role: 'editor',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(insert).not.toHaveBeenCalled();
  });

  it('refuses to delete the signed-in user', async () => {
    await expect(deleteUser.execute(admin.id, admin.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('refuses to delete the last administrator', async () => {
    findById.mockResolvedValue(admin);
    countByRole.mockResolvedValue(1);

    await expect(deleteUser.execute('other', admin.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(remove).not.toHaveBeenCalled();
  });

  it('refuses to delete a user who owns videos', async () => {
    findById.mockResolvedValue({
      ...admin,
      id: 'editor-1',
      role: 'editor',
    });
    countOwnedVideos.mockResolvedValue(2);

    await expect(
      deleteUser.execute(admin.id, 'editor-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses to demote the last administrator', async () => {
    findById.mockResolvedValue(admin);
    findByEmail.mockResolvedValue(admin);
    countByRole.mockResolvedValue(1);

    await expect(
      updateUser.execute(admin.id, {
        email: admin.email,
        role: 'viewer',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(update).not.toHaveBeenCalled();
  });
});
