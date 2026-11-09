import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';

@Injectable()
export class DeleteUser {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(actorId: string, id: string): Promise<void> {
    if (actorId === id) {
      throw new ForbiddenException('cannot_delete_self');
    }
    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundException('user_not_found');
    }
    if (user.role === 'admin' && (await this.users.countByRole('admin')) <= 1) {
      throw new ConflictException('last_admin');
    }
    if ((await this.users.countOwnedVideos(id)) > 0) {
      throw new ConflictException('user_owns_videos');
    }
    const removed = await this.users.delete(id);
    if (!removed) {
      throw new NotFoundException('user_not_found');
    }
  }
}
