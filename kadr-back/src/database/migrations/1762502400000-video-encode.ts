import { MigrationInterface, QueryRunner } from 'typeorm';

export class VideoEncode1762502400000 implements MigrationInterface {
  name = 'VideoEncode1762502400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "videos"
        ADD "quality" character varying(16) NOT NULL DEFAULT 'standard',
        ADD "rotate" boolean NOT NULL DEFAULT false,
        ADD "mute" boolean NOT NULL DEFAULT false,
        ADD "thumbnail_offset_seconds" integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "videos"
        DROP COLUMN "thumbnail_offset_seconds",
        DROP COLUMN "mute",
        DROP COLUMN "rotate",
        DROP COLUMN "quality"
    `);
  }
}
