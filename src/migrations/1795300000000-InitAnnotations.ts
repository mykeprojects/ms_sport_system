import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitAnnotations1795300000000 implements MigrationInterface {
  name = 'InitAnnotations1795300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('matches', 'home_team_id'))) {
      await queryRunner.query(
        'ALTER TABLE `matches` ADD `home_team_id` int NOT NULL, ADD `away_team_id` int NOT NULL',
      );
      await queryRunner.query(
        'ALTER TABLE `matches` ADD CONSTRAINT `fk_matches_home_team` FOREIGN KEY (`home_team_id`) REFERENCES `equipos`(`id`)',
      );
      await queryRunner.query(
        'ALTER TABLE `matches` ADD CONSTRAINT `fk_matches_away_team` FOREIGN KEY (`away_team_id`) REFERENCES `equipos`(`id`)',
      );
    } else {
      await queryRunner.query(
        'ALTER TABLE `matches` MODIFY `home_team_id` int NOT NULL, MODIFY `away_team_id` int NOT NULL',
      );
    }

    if (!(await queryRunner.hasTable('anotaciones'))) {
      await queryRunner.query(`
        CREATE TABLE \`anotaciones\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`match_id\` int NOT NULL,
          \`player_id\` int NOT NULL,
          \`team_id\` int NOT NULL,
          \`minute\` int NULL,
          \`description\` varchar(250) NOT NULL,
          \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          KEY \`idx_annotations_match\` (\`match_id\`),
          KEY \`idx_annotations_player\` (\`player_id\`),
          CONSTRAINT \`fk_annotations_match\` FOREIGN KEY (\`match_id\`) REFERENCES \`matches\`(\`id\`),
          CONSTRAINT \`fk_annotations_player\` FOREIGN KEY (\`player_id\`) REFERENCES \`jugadores\`(\`id\`),
          CONSTRAINT \`fk_annotations_team\` FOREIGN KEY (\`team_id\`) REFERENCES \`equipos\`(\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `anotaciones`');
    await queryRunner.query('ALTER TABLE `matches` DROP FOREIGN KEY `fk_matches_home_team`');
    await queryRunner.query('ALTER TABLE `matches` DROP FOREIGN KEY `fk_matches_away_team`');
    await queryRunner.query('ALTER TABLE `matches` DROP COLUMN `home_team_id`, DROP COLUMN `away_team_id`');
  }
}
