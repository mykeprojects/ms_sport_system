import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitTournaments1795400000000 implements MigrationInterface {
  name = 'InitTournaments1795400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('tournaments')) return;
    await queryRunner.query(`
      CREATE TABLE \`tournaments\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(120) NOT NULL,
        \`name_key\` varchar(120) NOT NULL,
        \`description\` varchar(500) NOT NULL DEFAULT '',
        \`sport_id\` int NOT NULL,
        \`location\` varchar(120) NULL,
        \`start_date\` date NOT NULL,
        \`end_date\` date NOT NULL,
        \`status\` varchar(20) NOT NULL DEFAULT 'DRAFT',
        \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_tournament_name_sport\` (\`name_key\`, \`sport_id\`),
        KEY \`idx_tournaments_sport\` (\`sport_id\`),
        CONSTRAINT \`fk_tournaments_sport\` FOREIGN KEY (\`sport_id\`) REFERENCES \`sports\`(\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `tournaments`');
  }
}
