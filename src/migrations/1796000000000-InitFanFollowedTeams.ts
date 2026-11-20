import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitFanFollowedTeams1796000000000 implements MigrationInterface {
  name = 'InitFanFollowedTeams1796000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`fan_followed_teams\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`fan_id\` INT NOT NULL,
        \`team_id\` INT NOT NULL,
        \`created_at\` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_fan_followed_team\` (\`fan_id\`, \`team_id\`),
        KEY \`idx_fan_followed_teams_fan\` (\`fan_id\`),
        KEY \`idx_fan_followed_teams_team\` (\`team_id\`),
        CONSTRAINT \`fk_fan_followed_teams_fan\` FOREIGN KEY (\`fan_id\`) REFERENCES \`fans\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_fan_followed_teams_team\` FOREIGN KEY (\`team_id\`) REFERENCES \`teams\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `fan_followed_teams`');
  }
}
