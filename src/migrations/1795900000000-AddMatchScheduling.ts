import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMatchScheduling1795900000000 implements MigrationInterface {
  name = 'AddMatchScheduling1795900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columns: Array<{ name: string; definition: string }> = [
      { name: 'tournament_id', definition: 'int NULL' },
      { name: 'phase_id', definition: 'int NULL' },
      { name: 'bracket_id', definition: 'int NULL' },
      { name: 'group_id', definition: 'int NULL' },
      { name: 'venue', definition: 'varchar(160) NULL' },
      { name: 'round_label', definition: 'varchar(40) NULL' },
    ];

    for (const column of columns) {
      if (!(await queryRunner.hasColumn('matches', column.name))) {
        await queryRunner.query(
          `ALTER TABLE \`matches\` ADD \`${column.name}\` ${column.definition}`,
        );
      }
    }

    await this.addKey(queryRunner, 'idx_matches_tournament', '`tournament_id`');
    await this.addKey(queryRunner, 'idx_matches_phase', '`phase_id`');
    await this.addKey(queryRunner, 'idx_matches_bracket', '`bracket_id`');
    await this.addKey(queryRunner, 'idx_matches_group', '`group_id`');

    await this.addForeignKey(
      queryRunner,
      'fk_matches_tournament',
      'tournament_id',
      'tournaments',
    );
    await this.addForeignKey(
      queryRunner,
      'fk_matches_phase',
      'phase_id',
      'tournament_phases',
    );
    await this.addForeignKey(
      queryRunner,
      'fk_matches_bracket',
      'bracket_id',
      'tournament_brackets',
    );
    await this.addForeignKey(
      queryRunner,
      'fk_matches_group',
      'group_id',
      'tournament_groups',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const constraint of [
      'fk_matches_tournament',
      'fk_matches_phase',
      'fk_matches_bracket',
      'fk_matches_group',
    ]) {
      await this.dropForeignKey(queryRunner, constraint);
    }

    for (const column of [
      'tournament_id',
      'phase_id',
      'bracket_id',
      'group_id',
      'venue',
      'round_label',
    ]) {
      if (await queryRunner.hasColumn('matches', column)) {
        await queryRunner.query(`ALTER TABLE \`matches\` DROP COLUMN \`${column}\``);
      }
    }
  }

  private async addKey(
    queryRunner: QueryRunner,
    name: string,
    column: string,
  ): Promise<void> {
    const rows: Array<{ count: number | string }> = await queryRunner.query(
      'SELECT COUNT(*) AS count FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?',
      ['matches', name],
    );
    if (Number(rows[0]?.count ?? 0) > 0) return;
    await queryRunner.query(
      `ALTER TABLE \`matches\` ADD KEY \`${name}\` (${column})`,
    );
  }

  private async addForeignKey(
    queryRunner: QueryRunner,
    name: string,
    column: string,
    referencedTable: string,
  ): Promise<void> {
    const rows: Array<{ count: number | string }> = await queryRunner.query(
      'SELECT COUNT(*) AS count FROM information_schema.table_constraints WHERE constraint_schema = DATABASE() AND table_name = ? AND constraint_name = ?',
      ['matches', name],
    );
    if (Number(rows[0]?.count ?? 0) > 0) return;
    await queryRunner.query(
      `ALTER TABLE \`matches\` ADD CONSTRAINT \`${name}\` FOREIGN KEY (\`${column}\`) REFERENCES \`${referencedTable}\`(\`id\`) ON DELETE SET NULL`,
    );
  }

  private async dropForeignKey(queryRunner: QueryRunner, name: string): Promise<void> {
    const rows: Array<{ count: number | string }> = await queryRunner.query(
      'SELECT COUNT(*) AS count FROM information_schema.table_constraints WHERE constraint_schema = DATABASE() AND table_name = ? AND constraint_name = ?',
      ['matches', name],
    );
    if (Number(rows[0]?.count ?? 0) === 0) return;
    await queryRunner.query(`ALTER TABLE \`matches\` DROP FOREIGN KEY \`${name}\``);
  }
}
