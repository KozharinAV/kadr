import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordModule } from '../auth/password.module';
import { CreateUser } from './application/create-user';
import { DeleteUser } from './application/delete-user';
import { ListUsers } from './application/list-users';
import { UpdateUser } from './application/update-user';
import { RefreshTokenEntity } from './infrastructure/refresh-token.entity';
import { RolePermissionEntity } from './infrastructure/role-permission.entity';
import { RoleEntity } from './infrastructure/role.entity';
import { TypeOrmUserRepository } from './infrastructure/typeorm-user.repository';
import { UserEntity } from './infrastructure/user.entity';
import { USER_REPOSITORY } from './domain/user.repository';
import { UsersController } from './presentation/users.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      RoleEntity,
      RolePermissionEntity,
      RefreshTokenEntity,
    ]),
    PasswordModule,
  ],
  controllers: [UsersController],
  providers: [
    ListUsers,
    CreateUser,
    UpdateUser,
    DeleteUser,
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
