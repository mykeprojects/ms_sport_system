import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentMethodType1795200000000 implements MigrationInterface {
  name = 'AddPaymentMethodType1795200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('payment_methods', 'method_type')) {
      return;
    }
    await queryRunner.query(
      "ALTER TABLE `payment_methods` ADD `method_type` varchar(30) NOT NULL DEFAULT 'OTHER'",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `payment_methods` DROP COLUMN `method_type`');
  }
}
