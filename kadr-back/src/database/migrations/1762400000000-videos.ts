import { MigrationInterface, QueryRunner } from 'typeorm';

export class Videos1762400000000 implements MigrationInterface {
  name = 'Videos1762400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "videos" (
        "id" uuid NOT NULL,
        "title" character varying(200) NOT NULL,
        "original_key" character varying(512) NOT NULL,
        "playback_key" character varying(512),
        "thumbnail_key" character varying(512),
        "status" character varying(32) NOT NULL,
        "failure_reason" text,
        "duration_seconds" double precision,
        "width" integer,
        "height" integer,
        "owner_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_videos" PRIMARY KEY ("id"),
        CONSTRAINT "FK_videos_owner" FOREIGN KEY ("owner_id") REFERENCES "users"("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "transcode_jobs" (
        "id" uuid NOT NULL,
        "video_id" uuid NOT NULL,
        "status" character varying(32) NOT NULL,
        "error" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "finished_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_transcode_jobs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_transcode_jobs_video" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_videos_owner_id" ON "videos" ("owner_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transcode_jobs_video_id" ON "transcode_jobs" ("video_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "transcode_jobs"`);
    await queryRunner.query(`DROP TABLE "videos"`);
  }
}
