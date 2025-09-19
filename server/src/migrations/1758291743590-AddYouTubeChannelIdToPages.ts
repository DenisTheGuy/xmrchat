import { MigrationInterface, QueryRunner } from "typeorm";

export class AddYouTubeChannelIdToPages1758291743590 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pages" ADD "youtubeChannelId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pages" DROP COLUMN "youtubeChannelId"`);
    }

}
