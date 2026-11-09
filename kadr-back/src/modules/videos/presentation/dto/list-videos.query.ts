import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ListVideosQuery {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}
