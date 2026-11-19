import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitTournamentGroups1795700000000 implements MigrationInterface {
  name = 'InitTournamentGroups1795700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('tournament_groups'))) {
      await queryRunner.query(`
        CREATE TABLE \`tournament_groups\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`phase_id\` int NOT NULL,
          \`name\` varchar(120) NOT NULL,
          \`name_key\` varchar(120) NOT NULL,
          \`group_order\` int NOT NULL DEFAULT 1,
          \`max_teams\` int NULL,
          \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uk_tournament_phase_group_name\` (\`phase_id\`, \`name_key\`),
          UNIQUE KEY \`uk_tournament_phase_group_order\` (\`phase_id\`, \`group_order\`),
          KEY \`idx_tournament_groups_phase\` (\`phase_id\`),
          CONSTRAINT \`fk_tournament_groups_phase\`
            FOREIGN KEY (\`phase_id\`) REFERENCES \`tournament_phases\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }

    if (!(await queryRunner.hasTable('tournament_group_teams'))) {
      await queryRunner.query(`
        CREATE TABLE \`tournament_group_teams\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`group_id\` int NOT NULL,
          \`team_id\` int NOT NULL,
          \`assigned_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uk_tournament_group_team\` (\`group_id\`, \`team_id\`),
          KEY \`idx_tournament_group_teams_team\` (\`team_id\`),
          CONSTRAINT \`fk_tournament_group_teams_group\`
            FOREIGN KEY (\`group_id\`) REFERENCES \`tournament_groups\`(\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`fk_tournament_group_teams_team\`
            FOREIGN KEY (\`team_id\`) REFERENCES \`teams\`(\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `tournament_group_teams`');
    await queryRunner.query('DROP TABLE IF EXISTS `tournament_groups`');
  }
}
