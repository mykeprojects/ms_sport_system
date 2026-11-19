import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitMatchReminderDeliveries1796100000000 implements MigrationInterface {
  name = 'InitMatchReminderDeliveries1796100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`match_reminder_deliveries\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`idempotency_key\` VARCHAR(191) NOT NULL,
        \`match_id\` INT NOT NULL,
        \`fan_id\` INT NOT NULL,
        \`fan_external_user_id\` INT NOT NULL,
        \`reminder_window\` INT NOT NULL,
        \`status\` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        \`attempt_count\` INT NOT NULL DEFAULT 0,
        \`last_attempt_at\` DATETIME NULL,
        \`next_attempt_at\` DATETIME NULL,
        \`last_error\` VARCHAR(500) NULL,
        \`processed_at\` DATETIME NULL,
        \`created_at\` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_match_reminder_delivery_key\` (\`idempotency_key\`),
        UNIQUE KEY \`uk_match_reminder_delivery_slot\` (\`match_id\`, \`fan_external_user_id\`, \`reminder_window\`),
        KEY \`idx_match_reminder_status_next\` (\`status\`, \`next_attempt_at\`),
        KEY \`idx_match_reminder_match\` (\`match_id\`),
        KEY \`idx_match_reminder_fan\` (\`fan_id\`),
        CONSTRAINT \`fk_match_reminder_match\` FOREIGN KEY (\`match_id\`) REFERENCES \`matches\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_match_reminder_fan\` FOREIGN KEY (\`fan_id\`) REFERENCES \`fans\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `match_reminder_deliveries`');
  }
}
