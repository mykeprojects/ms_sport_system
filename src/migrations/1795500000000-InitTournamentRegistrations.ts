import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitTournamentRegistrations1795500000000 implements MigrationInterface {
  name = 'InitTournamentRegistrations1795500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('tournament_registrations')) return;
    await queryRunner.query(`
      CREATE TABLE \`tournament_registrations\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`tournament_id\` int NOT NULL,
        \`team_id\` int NOT NULL,
        \`status\` varchar(20) NOT NULL DEFAULT 'REGISTERED',
        \`registered_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_tournament_team\` (\`tournament_id\`, \`team_id\`),
        KEY \`idx_tournament_registrations_team\` (\`team_id\`),
        CONSTRAINT \`fk_tournament_registrations_tournament\`
          FOREIGN KEY (\`tournament_id\`) REFERENCES \`tournaments\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_tournament_registrations_team\`
          FOREIGN KEY (\`team_id\`) REFERENCES \`teams\`(\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `tournament_registrations`');
  }
}
