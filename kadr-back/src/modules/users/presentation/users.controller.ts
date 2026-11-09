import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { Permission } from '../../auth/domain/permission';
import { CreateUser } from '../application/create-user';
import { DeleteUser } from '../application/delete-user';
import { ListUsers } from '../application/list-users';
import { UpdateUser } from '../application/update-user';
import type { UserProfile } from '../domain/user';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly listUsers: ListUsers,
    private readonly createUser: CreateUser,
    private readonly updateUser: UpdateUser,
    private readonly deleteUser: DeleteUser,
  ) {}

  @Get('me')
  me(@CurrentUser() user: UserProfile): UserProfile {
    return user;
  }

  @Get()
  @RequirePermissions(Permission.UserManage)
  list(): Promise<UserProfile[]> {
    return this.listUsers.execute();
  }

  @Post()
  @RequirePermissions(Permission.UserManage)
  create(@Body() dto: CreateUserDto): Promise<UserProfile> {
    return this.createUser.execute(dto);
  }

  @Patch(':id')
  @RequirePermissions(Permission.UserManage)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserProfile> {
    return this.updateUser.execute(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.UserManage)
  @HttpCode(204)
  remove(
    @CurrentUser() actor: UserProfile,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.deleteUser.execute(actor.id, id);
  }
}
