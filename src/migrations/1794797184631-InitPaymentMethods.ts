import { MigrationInterface, QueryRunner } from "typeorm";

export class InitPaymentMethods1794797184631 implements MigrationInterface {
    name = 'InitPaymentMethods1794797184631'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (await queryRunner.hasTable('payment_methods')) {
            return;
        }
        await queryRunner.query(`CREATE TABLE \`payment_methods\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(120) NOT NULL, \`description\` varchar(200) NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_a793d7354d7c3aaf76347ee5a6\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_a793d7354d7c3aaf76347ee5a6\` ON \`payment_methods\``);
        await queryRunner.query(`DROP TABLE \`payment_methods\``);
    }

}
