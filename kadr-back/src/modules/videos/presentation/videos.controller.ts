import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  Query,
  StreamableFile,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { tmpdir } from 'os';
import { extname } from 'path';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { Permission } from '../../auth/domain/permission';
import type { UserProfile } from '../../users/domain/user';
import { DeleteVideo } from '../application/delete-video';
import { GetThumbnail } from '../application/get-thumbnail';
import { GetVideo } from '../application/get-video';
import { ListVideos } from '../application/list-videos';
import { RetryTranscode } from '../application/retry-transcode';
import { UploadVideo } from '../application/upload-video';
import { VideoPresenter } from '../application/video-presenter';
import { ListVideosQuery } from './dto/list-videos.query';
import { UploadVideoDto } from './dto/upload-video.dto';
import { VideoResponse } from './video.response';

const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

@Controller('videos')
export class VideosController {
  constructor(
    private readonly uploadVideo: UploadVideo,
    private readonly listVideos: ListVideos,
    private readonly getVideo: GetVideo,
    private readonly getThumbnail: GetThumbnail,
    private readonly deleteVideo: DeleteVideo,
    private readonly retryTranscode: RetryTranscode,
    private readonly presenter: VideoPresenter,
  ) {}

  @Post()
  @RequirePermissions(Permission.VideoUpload)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: tmpdir(),
        filename: (_request, file, callback) => {
          const extension = extname(file.originalname).toLowerCase();
          callback(null, `${randomUUID()}${extension}`);
        },
      }),
      limits: { fileSize: MAX_UPLOAD_BYTES },
    }),
  )
  async upload(
    @CurrentUser() actor: UserProfile,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadVideoDto,
  ): Promise<VideoResponse> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const video = await this.uploadVideo.execute(
      actor,
      {
        path: file.path,
        originalName: file.originalname,
        mimeType: file.mimetype,
      },
      {
        quality: dto.quality,
        rotate: dto.rotate,
        mute: dto.mute,
        thumbnailOffsetSeconds: dto.thumbnailOffset,
      },
      dto.title,
    );
    return this.presenter.present(video);
  }

  @Get()
  @RequirePermissions(Permission.VideoRead)
  async list(
    @CurrentUser() actor: UserProfile,
    @Query() query: ListVideosQuery,
  ): Promise<VideoResponse[]> {
    const videos = await this.listVideos.execute(actor, query.q);
    return Promise.all(videos.map((video) => this.presenter.present(video)));
  }

  @Public()
  @Get(':id/thumbnail')
  @Header('Cache-Control', 'public, max-age=1800')
  async thumbnail(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StreamableFile> {
    const body = await this.getThumbnail.execute(id);
    return new StreamableFile(body, { type: 'image/jpeg' });
  }

  @Get(':id')
  @RequirePermissions(Permission.VideoRead)
  async get(
    @CurrentUser() actor: UserProfile,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<VideoResponse> {
    return this.presenter.present(await this.getVideo.execute(actor, id));
  }

  @Delete(':id')
  @RequirePermissions(Permission.VideoDelete)
  @HttpCode(204)
  remove(
    @CurrentUser() actor: UserProfile,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.deleteVideo.execute(actor, id);
  }

  @Post(':id/retry')
  @RequirePermissions(Permission.VideoRetry)
  async retry(
    @CurrentUser() actor: UserProfile,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<VideoResponse> {
    return this.presenter.present(await this.retryTranscode.execute(actor, id));
  }
}
