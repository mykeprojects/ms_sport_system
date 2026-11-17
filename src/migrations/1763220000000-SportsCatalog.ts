import { MigrationInterface, QueryRunner } from 'typeorm';

export class SportsCatalog1763220000000 implements MigrationInterface {
  name = 'SportsCatalog1763220000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE sports (
        id INT NOT NULL AUTO_INCREMENT,
        code VARCHAR(20) NOT NULL,
        name VARCHAR(120) NOT NULL,
        name_key VARCHAR(120) NOT NULL,
        category VARCHAR(80) NOT NULL,
        description VARCHAR(250) NOT NULL,
        status VARCHAR(20) NOT NULL,
        parent_id INT NULL,
        created_at VARCHAR(10) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uk_sports_code (code),
        UNIQUE KEY uk_sports_name_key (name_key),
        KEY idx_sports_parent (parent_id),
        CONSTRAINT fk_sports_parent FOREIGN KEY (parent_id) REFERENCES sports (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`
      CREATE TABLE teams (
        id INT NOT NULL AUTO_INCREMENT,
        code VARCHAR(20) NOT NULL,
        name VARCHAR(120) NOT NULL,
        name_key VARCHAR(120) NOT NULL,
        short_name VARCHAR(40) NOT NULL,
        city VARCHAR(80) NOT NULL,
        description VARCHAR(500) NOT NULL,
        status VARCHAR(20) NOT NULL,
        created_at VARCHAR(10) NOT NULL,
        color VARCHAR(20) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uk_teams_code (code),
        UNIQUE KEY uk_teams_name_key (name_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`
      CREATE TABLE team_sports (
        id INT NOT NULL AUTO_INCREMENT,
        team_id INT NOT NULL,
        sport_id INT NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uk_team_sport (team_id, sport_id),
        KEY idx_team_sports_sport (sport_id),
        CONSTRAINT fk_ed_team FOREIGN KEY (team_id) REFERENCES teams (id),
        CONSTRAINT fk_ed_sport FOREIGN KEY (sport_id) REFERENCES sports (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`
      CREATE TABLE players (
        id INT NOT NULL AUTO_INCREMENT,
        full_name VARCHAR(160) NOT NULL,
        document VARCHAR(40) NOT NULL,
        document_key VARCHAR(40) NOT NULL,
        age INT NOT NULL,
        nationality VARCHAR(80) NOT NULL,
        position VARCHAR(20) NOT NULL,
        height_m DECIMAL(4,2) NOT NULL,
        dominant_foot VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL,
        email VARCHAR(160) NOT NULL,
        phone VARCHAR(40) NOT NULL,
        preferred_sport_id INT NULL,
        matches INT NOT NULL DEFAULT 0,
        goals INT NOT NULL DEFAULT 0,
        assists INT NOT NULL DEFAULT 0,
        rating DECIMAL(4,2) NOT NULL DEFAULT 0,
        PRIMARY KEY (id),
        UNIQUE KEY uk_players_document_key (document_key),
        KEY idx_players_sport (preferred_sport_id),
        CONSTRAINT fk_players_sport FOREIGN KEY (preferred_sport_id) REFERENCES sports (id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`
      CREATE TABLE contracts (
        id INT NOT NULL AUTO_INCREMENT,
        player_id INT NOT NULL,
        team_id INT NOT NULL,
        start_date VARCHAR(10) NOT NULL,
        end_date VARCHAR(10) NOT NULL,
        status VARCHAR(20) NOT NULL,
        end_reason VARCHAR(80) NULL,
        detail VARCHAR(250) NULL,
        active_player_key INT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uk_contracts_activa (active_player_key),
        KEY idx_contracts_player (player_id),
        KEY idx_contracts_team (team_id),
        CONSTRAINT fk_contracts_player FOREIGN KEY (player_id) REFERENCES players (id),
        CONSTRAINT fk_contracts_team FOREIGN KEY (team_id) REFERENCES teams (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`
      CREATE TABLE skills (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(120) NOT NULL,
        name_key VARCHAR(120) NOT NULL,
        category VARCHAR(20) NOT NULL,
        description VARCHAR(250) NOT NULL,
        glyph VARCHAR(20) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uk_skills_name_key (name_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`
      CREATE TABLE player_skills (
        id INT NOT NULL AUTO_INCREMENT,
        player_id INT NOT NULL,
        skill_id INT NOT NULL,
        score INT NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uk_player_skill (player_id, skill_id),
        KEY idx_player_skills_skill (skill_id),
        CONSTRAINT fk_player_skills_player FOREIGN KEY (player_id) REFERENCES players (id),
        CONSTRAINT fk_player_skills_skill FOREIGN KEY (skill_id) REFERENCES skills (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS player_skills');
    await queryRunner.query('DROP TABLE IF EXISTS contracts');
    await queryRunner.query('DROP TABLE IF EXISTS team_sports');
    await queryRunner.query('DROP TABLE IF EXISTS players');
    await queryRunner.query('DROP TABLE IF EXISTS skills');
    await queryRunner.query('DROP TABLE IF EXISTS teams');
    await queryRunner.query('DROP TABLE IF EXISTS sports');
  }
}
