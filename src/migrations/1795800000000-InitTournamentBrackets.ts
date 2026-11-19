import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitTournamentBrackets1795800000000 implements MigrationInterface {
  name = 'InitTournamentBrackets1795800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('tournament_brackets')) return;
    await queryRunner.query(`
      CREATE TABLE \`tournament_brackets\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`phase_id\` int NOT NULL,
        \`round_type\` varchar(20) NOT NULL,
        \`bracket_order\` int NOT NULL,
        \`team_a_id\` int NULL,
        \`team_b_id\` int NULL,
        \`winner_team_id\` int NULL,
        \`status\` varchar(20) NOT NULL DEFAULT 'PENDING',
        \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_tournament_bracket_slot\` (\`phase_id\`, \`round_type\`, \`bracket_order\`),
        KEY \`idx_tournament_brackets_phase\` (\`phase_id\`),
        KEY \`idx_tournament_brackets_team_a\` (\`team_a_id\`),
        KEY \`idx_tournament_brackets_team_b\` (\`team_b_id\`),
        KEY \`idx_tournament_brackets_winner\` (\`winner_team_id\`),
        CONSTRAINT \`fk_tournament_brackets_phase\`
          FOREIGN KEY (\`phase_id\`) REFERENCES \`tournament_phases\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_tournament_brackets_team_a\`
          FOREIGN KEY (\`team_a_id\`) REFERENCES \`teams\`(\`id\`),
        CONSTRAINT \`fk_tournament_brackets_team_b\`
          FOREIGN KEY (\`team_b_id\`) REFERENCES \`teams\`(\`id\`),
        CONSTRAINT \`fk_tournament_brackets_winner\`
          FOREIGN KEY (\`winner_team_id\`) REFERENCES \`teams\`(\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `tournament_brackets`');
  }
}
