import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import type { RoleName } from '../../../auth/domain/role-name';

export class CreateUserDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsIn(['admin', 'editor', 'viewer'])
  role!: RoleName;
}
