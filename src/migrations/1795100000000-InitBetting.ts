import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitBetting1795100000000 implements MigrationInterface {
  name = 'InitBetting1795100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`fans\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`external_user_id\` INT NOT NULL,
        \`email\` VARCHAR(160) NULL,
        \`full_name\` VARCHAR(160) NULL,
        \`created_at\` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_fans_external_user_id\` (\`external_user_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`fan_payment_methods\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`fan_id\` INT NOT NULL,
        \`payment_method_id\` INT NOT NULL,
        \`masked_reference\` VARCHAR(40) NOT NULL DEFAULT '***',
        \`holder_name\` VARCHAR(120) NULL,
        \`is_active\` TINYINT NOT NULL DEFAULT 1,
        \`created_at\` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_fan_payment_method\` (\`fan_id\`, \`payment_method_id\`, \`masked_reference\`),
        KEY \`idx_fan_payment_methods_fan\` (\`fan_id\`),
        KEY \`idx_fan_payment_methods_method\` (\`payment_method_id\`),
        CONSTRAINT \`fk_fpm_fan\` FOREIGN KEY (\`fan_id\`) REFERENCES \`fans\` (\`id\`),
        CONSTRAINT \`fk_fpm_payment_method\` FOREIGN KEY (\`payment_method_id\`) REFERENCES \`payment_methods\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`matches\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`home_team\` VARCHAR(120) NOT NULL,
        \`away_team\` VARCHAR(120) NOT NULL,
        \`sport_id\` INT NULL,
        \`scheduled_at\` DATETIME NULL,
        \`starts_at\` DATETIME NOT NULL,
        \`betting_closes_at\` DATETIME NOT NULL,
        \`status\` VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
        \`betting_enabled\` TINYINT NOT NULL DEFAULT 1,
        \`official_result\` VARCHAR(10) NULL,
        \`home_odd\` DECIMAL(10,2) NOT NULL,
        \`away_odd\` DECIMAL(10,2) NOT NULL,
        \`draw_odd\` DECIMAL(10,2) NOT NULL,
        \`created_at\` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`idx_matches_status\` (\`status\`),
        KEY \`idx_matches_starts_at\` (\`starts_at\`),
        KEY \`idx_matches_sport\` (\`sport_id\`),
        CONSTRAINT \`fk_matches_sport\` FOREIGN KEY (\`sport_id\`) REFERENCES \`sports\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`bets\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`match_id\` INT NOT NULL,
        \`fan_id\` INT NOT NULL,
        \`fan_payment_method_id\` INT NOT NULL,
        \`selection\` VARCHAR(10) NOT NULL,
        \`stake_amount\` DECIMAL(12,2) NOT NULL,
        \`locked_odd\` DECIMAL(10,2) NOT NULL,
        \`status\` VARCHAR(20) NOT NULL DEFAULT 'REGISTERED',
        \`settled_amount\` DECIMAL(12,2) NOT NULL DEFAULT 0,
        \`settled\` TINYINT NOT NULL DEFAULT 0,
        \`settled_at\` DATETIME NULL,
        \`created_at\` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`idx_bets_match_settled\` (\`match_id\`, \`settled\`),
        KEY \`idx_bets_fan\` (\`fan_id\`),
        KEY \`idx_bets_payment_method\` (\`fan_payment_method_id\`),
        CONSTRAINT \`fk_bets_match\` FOREIGN KEY (\`match_id\`) REFERENCES \`matches\` (\`id\`),
        CONSTRAINT \`fk_bets_fan\` FOREIGN KEY (\`fan_id\`) REFERENCES \`fans\` (\`id\`),
        CONSTRAINT \`fk_bets_fan_payment_method\` FOREIGN KEY (\`fan_payment_method_id\`) REFERENCES \`fan_payment_methods\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `bets`');
    await queryRunner.query('DROP TABLE IF EXISTS `matches`');
    await queryRunner.query('DROP TABLE IF EXISTS `fan_payment_methods`');
    await queryRunner.query('DROP TABLE IF EXISTS `fans`');
  }
}
