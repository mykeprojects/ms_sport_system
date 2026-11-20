import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitTournamentPhases1795600000000 implements MigrationInterface {
  name = 'InitTournamentPhases1795600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('tournament_phases')) return;
    await queryRunner.query(`
      CREATE TABLE \`tournament_phases\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`tournament_id\` int NOT NULL,
        \`name\` varchar(120) NOT NULL,
        \`name_key\` varchar(120) NOT NULL,
        \`phase_order\` int NOT NULL,
        \`phase_type\` varchar(20) NOT NULL,
        \`start_date\` date NOT NULL,
        \`end_date\` date NOT NULL,
        \`status\` varchar(20) NOT NULL DEFAULT 'PLANNED',
        \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_tournament_phase_order\` (\`tournament_id\`, \`phase_order\`),
        UNIQUE KEY \`uk_tournament_phase_name\` (\`tournament_id\`, \`name_key\`),
        KEY \`idx_tournament_phases_tournament\` (\`tournament_id\`),
        CONSTRAINT \`fk_tournament_phases_tournament\`
          FOREIGN KEY (\`tournament_id\`) REFERENCES \`tournaments\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `tournament_phases`');
  }
}
