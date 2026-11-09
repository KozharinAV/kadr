import { Inject, Injectable } from '@nestjs/common';
import type { UserProfile } from '../domain/user';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';

@Injectable()
export class ListUsers {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  execute(): Promise<UserProfile[]> {
    return this.users.list();
  }
}
