import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitMatchTracking1795450000000 implements MigrationInterface {
  name = 'InitMatchTracking1795450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE match_tracking_sessions (
        id INT NOT NULL AUTO_INCREMENT,
        match_id INT NOT NULL,
        sport_id INT NULL,
        sport_name VARCHAR(120) NOT NULL,
        players_per_team INT NOT NULL,
        field_width DECIMAL(8,2) NOT NULL,
        field_height DECIMAL(8,2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'RUNNING',
        started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_tracking_match (match_id),
        KEY idx_tracking_status (status),
        CONSTRAINT fk_tracking_match FOREIGN KEY (match_id) REFERENCES matches (id),
        CONSTRAINT fk_tracking_sport FOREIGN KEY (sport_id) REFERENCES sports (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`
      CREATE TABLE match_tracking_players (
        id INT NOT NULL AUTO_INCREMENT,
        session_id INT NOT NULL,
        match_id INT NOT NULL,
        team_id INT NOT NULL,
        player_id INT NOT NULL,
        side VARCHAR(10) NOT NULL,
        jersey_number INT NOT NULL,
        initial_x DECIMAL(8,2) NOT NULL,
        initial_y DECIMAL(8,2) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uk_tracking_session_player (session_id, player_id),
        KEY idx_tracking_player_match (match_id),
        CONSTRAINT fk_tracking_player_session FOREIGN KEY (session_id) REFERENCES match_tracking_sessions (id) ON DELETE CASCADE,
        CONSTRAINT fk_tracking_player_match FOREIGN KEY (match_id) REFERENCES matches (id),
        CONSTRAINT fk_tracking_player_team FOREIGN KEY (team_id) REFERENCES teams (id),
        CONSTRAINT fk_tracking_player_player FOREIGN KEY (player_id) REFERENCES players (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`
      CREATE TABLE match_tracking_balls (
        id INT NOT NULL AUTO_INCREMENT,
        session_id INT NOT NULL,
        match_id INT NOT NULL,
        name VARCHAR(120) NOT NULL,
        initial_x DECIMAL(8,2) NOT NULL,
        initial_y DECIMAL(8,2) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uk_tracking_ball_session (session_id),
        UNIQUE KEY uk_tracking_ball_match (match_id),
        CONSTRAINT fk_tracking_ball_session FOREIGN KEY (session_id) REFERENCES match_tracking_sessions (id) ON DELETE CASCADE,
        CONSTRAINT fk_tracking_ball_match FOREIGN KEY (match_id) REFERENCES matches (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`
      CREATE TABLE match_tracking_positions (
        id BIGINT NOT NULL AUTO_INCREMENT,
        session_id INT NOT NULL,
        match_id INT NOT NULL,
        subject_type VARCHAR(10) NOT NULL,
        player_id INT NULL,
        ball_id INT NULL,
        team_id INT NULL,
        x DECIMAL(8,2) NOT NULL,
        y DECIMAL(8,2) NOT NULL,
        sequence BIGINT NOT NULL,
        recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_tracking_position_session (session_id, id),
        KEY idx_tracking_position_match (match_id),
        KEY idx_tracking_position_player (player_id),
        CONSTRAINT fk_tracking_position_session FOREIGN KEY (session_id) REFERENCES match_tracking_sessions (id) ON DELETE CASCADE,
        CONSTRAINT fk_tracking_position_match FOREIGN KEY (match_id) REFERENCES matches (id),
        CONSTRAINT fk_tracking_position_player FOREIGN KEY (player_id) REFERENCES players (id),
        CONSTRAINT fk_tracking_position_ball FOREIGN KEY (ball_id) REFERENCES match_tracking_balls (id),
        CONSTRAINT fk_tracking_position_team FOREIGN KEY (team_id) REFERENCES teams (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS match_tracking_positions');
    await queryRunner.query('DROP TABLE IF EXISTS match_tracking_balls');
    await queryRunner.query('DROP TABLE IF EXISTS match_tracking_players');
    await queryRunner.query('DROP TABLE IF EXISTS match_tracking_sessions');
  }
}
