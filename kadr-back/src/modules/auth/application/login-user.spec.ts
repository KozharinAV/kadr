import { UnauthorizedException } from '@nestjs/common';
import { LoginUser } from './login-user';
import { IssueSession } from './issue-session';
import { PasswordHasher } from './password-hasher';
import { User } from '../../users/domain/user';
import { UserRepository } from '../../users/domain/user.repository';
import { Permission } from '../domain/permission';

describe('LoginUser', () => {
  const user: User = {
    id: 'user-1',
    email: 'admin@kadr.local',
    passwordHash: 'hash',
    role: 'admin',
    permissions: [Permission.UserManage],
  };

  const findByEmail = jest.fn<UserRepository['findByEmail']>();
  const verify = jest.fn<PasswordHasher['verify']>();
  const execute = jest.fn<IssueSession['execute']>();
  const users: Pick<UserRepository, 'findByEmail'> = { findByEmail };
  const passwords: PasswordHasher = {
    hash: jest.fn(),
    verify,
  };
  const sessions: Pick<IssueSession, 'execute'> = { execute };

  const login = new LoginUser(
    users as UserRepository,
    passwords,
    sessions as IssueSession,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    findByEmail.mockResolvedValue(user);
    verify.mockResolvedValue(true);
    execute.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
  });

  it('returns a session for a matching password', async () => {
    await expect(
      login.execute(' Admin@Kadr.Local ', 'Admin123!'),
    ).resolves.toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
    expect(findByEmail).toHaveBeenCalledWith('admin@kadr.local');
  });

  it('rejects an unknown user without creating a session', async () => {
    findByEmail.mockResolvedValueOnce(null);

    await expect(
      login.execute('missing@kadr.local', 'Admin123!'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(execute).not.toHaveBeenCalled();
  });
});
