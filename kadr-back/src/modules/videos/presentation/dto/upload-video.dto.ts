import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { VideoQuality } from '../../domain/encode-settings';

const QUALITIES: VideoQuality[] = ['high', 'standard', 'economy'];

export class UploadVideoDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsIn(QUALITIES)
  quality!: VideoQuality;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  rotate!: boolean;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  mute!: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(86400)
  thumbnailOffset!: number;
}
