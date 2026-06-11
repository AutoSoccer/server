'use strict';

/**
 * WS-06 — Cria as stored procedures consumidas pelo modulo `reports`.
 *
 * As tres procedures abaixo centralizam regras de agregacao usadas pelos
 * relatorios da aplicacao. Mantendo-as no banco evitamos espalhar `JOIN`s e
 * heuristicas pelo codigo TS, alem de permitir tuning de indices futuro sem
 * mudanca de aplicacao — qualquer ajuste vira via nova migration.
 *
 *  - `sp_get_top_athletes_by_role(role, limit)`
 *      Top atletas por posicao tatica, ordenados por poder bruto
 *      (`attack + defense + velocity`).
 *
 *  - `sp_team_power_ranking(limit)`
 *      Ranking de equipes pelo somatorio do poder dos atletas que compoem o
 *      time, com metricas auxiliares de campanha (vitorias, derrotas,
 *      trofeus do usuario).
 *
 *  - `sp_market_overview()`
 *      Visao agregada do mercado: totais globais, breakdown por tier e por
 *      posicao tatica. Emite tres SELECTs (totais, por tier, por role) na
 *      mesma ordem em que o servico TS consome.
 */

const PROCEDURES = [
  'sp_get_top_athletes_by_role',
  'sp_team_power_ranking',
  'sp_market_overview'
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    for (const name of PROCEDURES) {
      await queryInterface.sequelize.query(`DROP PROCEDURE IF EXISTS ${name};`);
    }

    await queryInterface.sequelize.query(`
      CREATE PROCEDURE sp_get_top_athletes_by_role(
        IN p_role VARCHAR(20),
        IN p_limit INT
      )
      BEGIN
        DECLARE v_limit INT;

        SET v_limit = IFNULL(p_limit, 10);
        IF v_limit < 1 THEN
          SET v_limit = 1;
        END IF;
        IF v_limit > 100 THEN
          SET v_limit = 100;
        END IF;

        SELECT
          a.id,
          a.name,
          a.type AS role,
          a.tier,
          a.velocity,
          a.attack,
          a.defense,
          a.cost,
          (a.attack + a.defense + a.velocity) AS power
        FROM athletes a
        WHERE p_role IS NULL OR a.type = p_role
        ORDER BY power DESC, a.id ASC
        LIMIT v_limit;
      END
    `);

    await queryInterface.sequelize.query(`
      CREATE PROCEDURE sp_team_power_ranking(
        IN p_limit INT
      )
      BEGIN
        DECLARE v_limit INT;

        SET v_limit = IFNULL(p_limit, 20);
        IF v_limit < 1 THEN
          SET v_limit = 1;
        END IF;
        IF v_limit > 200 THEN
          SET v_limit = 200;
        END IF;

        SELECT
          t.id AS team_id,
          t.name AS team_name,
          u.id AS user_id,
          u.nickname AS user_nickname,
          COUNT(ta.athlete_id) AS athlete_count,
          COALESCE(SUM(a.attack + a.defense + a.velocity), 0) AS total_power,
          COALESCE(AVG(a.attack + a.defense + a.velocity), 0) AS avg_power,
          u.trophies AS trophies,
          t.victory AS victory,
          t.lose AS defeat
        FROM teams t
        INNER JOIN users u ON u.id = t.user_id
        LEFT JOIN team_athletes ta ON ta.team_id = t.id
        LEFT JOIN athletes a ON a.id = ta.athlete_id
        WHERE u.is_guest = 0
        GROUP BY t.id, t.name, u.id, u.nickname, u.trophies, t.victory, t.lose
        ORDER BY total_power DESC, u.trophies DESC, t.id ASC
        LIMIT v_limit;
      END
    `);

    await queryInterface.sequelize.query(`
      CREATE PROCEDURE sp_market_overview()
      BEGIN
        SELECT
          COUNT(*) AS athlete_count,
          AVG(a.cost) AS avg_cost,
          AVG(a.attack + a.defense + a.velocity) AS avg_power,
          (SELECT COUNT(*) FROM market_windows) AS active_market_slots
        FROM athletes a;

        SELECT
          a.tier AS tier,
          COUNT(*) AS athlete_count,
          AVG(a.cost) AS avg_cost,
          AVG(a.attack + a.defense + a.velocity) AS avg_power
        FROM athletes a
        GROUP BY a.tier
        ORDER BY avg_power DESC;

        SELECT
          a.type AS role,
          COUNT(*) AS athlete_count,
          AVG(a.cost) AS avg_cost,
          AVG(a.attack + a.defense + a.velocity) AS avg_power
        FROM athletes a
        GROUP BY a.type
        ORDER BY avg_power DESC;
      END
    `);
  },

  async down(queryInterface) {
    for (const name of PROCEDURES) {
      await queryInterface.sequelize.query(`DROP PROCEDURE IF EXISTS ${name};`);
    }
  }
};
