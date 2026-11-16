import { MigrationInterface, QueryRunner } from 'typeorm';

export class CatalogoDeportivo1763220000000 implements MigrationInterface {
  name = 'CatalogoDeportivo1763220000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE deportes (
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
        UNIQUE KEY uk_deportes_code (code),
        UNIQUE KEY uk_deportes_name_key (name_key),
        KEY idx_deportes_parent (parent_id),
        CONSTRAINT fk_deportes_parent FOREIGN KEY (parent_id) REFERENCES deportes (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`
      CREATE TABLE equipos (
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
        UNIQUE KEY uk_equipos_code (code),
        UNIQUE KEY uk_equipos_name_key (name_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`
      CREATE TABLE equipo_deportes (
        id INT NOT NULL AUTO_INCREMENT,
        equipo_id INT NOT NULL,
        deporte_id INT NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uk_equipo_deporte (equipo_id, deporte_id),
        KEY idx_equipo_deportes_deporte (deporte_id),
        CONSTRAINT fk_ed_equipo FOREIGN KEY (equipo_id) REFERENCES equipos (id),
        CONSTRAINT fk_ed_deporte FOREIGN KEY (deporte_id) REFERENCES deportes (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`
      CREATE TABLE jugadores (
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
        UNIQUE KEY uk_jugadores_document_key (document_key),
        KEY idx_jugadores_deporte (preferred_sport_id),
        CONSTRAINT fk_jugadores_deporte FOREIGN KEY (preferred_sport_id) REFERENCES deportes (id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`
      CREATE TABLE vinculaciones (
        id INT NOT NULL AUTO_INCREMENT,
        jugador_id INT NOT NULL,
        equipo_id INT NOT NULL,
        start_date VARCHAR(10) NOT NULL,
        end_date VARCHAR(10) NOT NULL,
        status VARCHAR(20) NOT NULL,
        end_reason VARCHAR(80) NULL,
        detail VARCHAR(250) NULL,
        active_player_key INT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uk_vinculaciones_activa (active_player_key),
        KEY idx_vinculaciones_jugador (jugador_id),
        KEY idx_vinculaciones_equipo (equipo_id),
        CONSTRAINT fk_vinculaciones_jugador FOREIGN KEY (jugador_id) REFERENCES jugadores (id),
        CONSTRAINT fk_vinculaciones_equipo FOREIGN KEY (equipo_id) REFERENCES equipos (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`
      CREATE TABLE habilidades (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(120) NOT NULL,
        name_key VARCHAR(120) NOT NULL,
        category VARCHAR(20) NOT NULL,
        description VARCHAR(250) NOT NULL,
        glyph VARCHAR(20) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uk_habilidades_name_key (name_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`
      CREATE TABLE jugador_habilidades (
        id INT NOT NULL AUTO_INCREMENT,
        jugador_id INT NOT NULL,
        habilidad_id INT NOT NULL,
        score INT NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uk_jugador_habilidad (jugador_id, habilidad_id),
        KEY idx_jugador_habilidades_habilidad (habilidad_id),
        CONSTRAINT fk_jh_jugador FOREIGN KEY (jugador_id) REFERENCES jugadores (id),
        CONSTRAINT fk_jh_habilidad FOREIGN KEY (habilidad_id) REFERENCES habilidades (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS jugador_habilidades');
    await queryRunner.query('DROP TABLE IF EXISTS vinculaciones');
    await queryRunner.query('DROP TABLE IF EXISTS equipo_deportes');
    await queryRunner.query('DROP TABLE IF EXISTS jugadores');
    await queryRunner.query('DROP TABLE IF EXISTS habilidades');
    await queryRunner.query('DROP TABLE IF EXISTS equipos');
    await queryRunner.query('DROP TABLE IF EXISTS deportes');
  }
}
