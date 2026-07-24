const express = require('express');
const dbConnect = require("../db/connect");

const router = express.Router()
const db = dbConnect();

// Para agregar los resultados a la base de datos
router.post('/log/administrador/poomsae/resultados/agregar', async (req, res) => {

    const competidores = req.body;

    if (
      !Array.isArray(competidores) ||
      competidores.length === 0
    ) {
      return res.status(400).json({
        message:
          'Se requiere un arreglo de resultados'
      });
    }

    const client = await db.connect();

    try {
      await client.query('BEGIN');

      const idEvento =
        Number(competidores[0].id_evento_fk);

      const eventoQuery = `
        select
          id_evento,
          titulo_evento
        from evento
        where id_evento = $1
        limit 1
      `;

      const eventoResultado =
        await client.query(
          eventoQuery,
          [idEvento]
        );

      if (eventoResultado.rows.length === 0) {
        throw new Error(
          `No existe el evento ${idEvento}`
        );
      }

      const evento =
        eventoResultado.rows[0];

      /*
       * Seguridad adicional:
       * en modalidad grupal dejamos un solo
       * puntaje positivo por equipo.
       */
      const equiposConPuntaje = new Set();

      for (const competidor of competidores) {

        let puntaje =
          Number(competidor.puntaje || 0);

        const modalidadGrupal = [
          'Mixto',
          'Equipo',
          'Freestyle-Mixto',
          'Freestyle-Equipo'
        ].includes(
          competidor.poomsae_modalidad
        );

        if (modalidadGrupal) {
          if (!competidor.equipo_id) {
            throw new Error(
              'El resultado grupal no contiene equipo_id'
            );
          }

          if (
            puntaje > 0 &&
            equiposConPuntaje.has(
              competidor.equipo_id
            )
          ) {
            puntaje = 0;
          }

          if (puntaje > 0) {
            equiposConPuntaje.add(
              competidor.equipo_id
            );
          }
        }

        const resultadoSql = `
          insert into poomsae_resultado (
            id_evento_fk,
            poomsae_categoria,
            poomsae_cinturon,
            poomsae_genero,
            poomsae_cedula,
            puntaje,
            ubicacion,
            poomsae_modalidad,
            equipo_id,
            posicion,
            nivel_poomsae,
            poomsae_nombres,
            poomsae_apellidos
          )
          values (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13
          )
          on conflict (
            id_evento_fk,
            poomsae_modalidad,
            poomsae_categoria,
            nivel_poomsae,
            poomsae_cedula
          )
          do update set
            poomsae_cinturon =
              excluded.poomsae_cinturon,
            poomsae_genero =
              excluded.poomsae_genero,
            puntaje =
              excluded.puntaje,
            ubicacion =
              excluded.ubicacion,
            equipo_id =
              excluded.equipo_id,
            posicion =
              excluded.posicion,
            poomsae_nombres =
              excluded.poomsae_nombres,
            poomsae_apellidos =
              excluded.poomsae_apellidos
        `;

        await client.query(
          resultadoSql,
          [
            idEvento,
            competidor.poomsae_categoria,
            competidor.poomsae_cinturon,
            competidor.poomsae_genero,
            competidor.poomsae_cedula,
            puntaje,
            competidor.ubicacion || 'NADA',
            competidor.poomsae_modalidad,
            competidor.equipo_id || null,
            competidor.posicion || null,
            competidor.nivel_poomsae,
            competidor.poomsae_nombres,
            competidor.poomsae_apellidos
          ]
        );

        const historialSql = `
          insert into historial_resultado_poomsae (
            titulo_evento,
            poomsae_categoria,
            poomsae_cinturon,
            poomsae_genero,
            poomsae_cedula,
            poomsae_nombres,
            poomsae_apellidos,
            poomsae_nombre_delegacion,
            ubicacion,
            id_evento,
            poomsae_modalidad,
            equipo_id,
            posicion,
            nivel_poomsae
          )
          values (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14
          )
          on conflict (
            id_evento,
            poomsae_modalidad,
            poomsae_categoria,
            nivel_poomsae,
            poomsae_cedula
          )
          do update set
            titulo_evento =
              excluded.titulo_evento,
            poomsae_cinturon =
              excluded.poomsae_cinturon,
            poomsae_genero =
              excluded.poomsae_genero,
            poomsae_nombres =
              excluded.poomsae_nombres,
            poomsae_apellidos =
              excluded.poomsae_apellidos,
            poomsae_nombre_delegacion =
              excluded.poomsae_nombre_delegacion,
            ubicacion =
              excluded.ubicacion,
            equipo_id =
              excluded.equipo_id,
            posicion =
              excluded.posicion
        `;

        await client.query(
          historialSql,
          [
            evento.titulo_evento,
            competidor.poomsae_categoria,
            competidor.poomsae_cinturon,
            competidor.poomsae_genero,
            competidor.poomsae_cedula,
            competidor.poomsae_nombres,
            competidor.poomsae_apellidos,
            competidor
              .poomsae_nombre_delegacion,
            competidor.ubicacion || 'NADA',
            idEvento,
            competidor.poomsae_modalidad,
            competidor.equipo_id || null,
            competidor.posicion || null,
            competidor.nivel_poomsae
          ]
        );
      }

      await client.query('COMMIT');

      return res.status(200).json({
        message:
          'Resultados de Poomsae guardados correctamente'
      });

    } catch (error) {
      await client.query('ROLLBACK');

      console.error(
        'Error al guardar resultados Poomsae:',
        error
      );

      return res.status(500).json({
        message:
          error.message ||
          'Error al guardar los resultados'
      });

    } finally {
      client.release();
    }
  }
);

// Para listar los resultados
router.get('/log/administrador/poomsae/resultados/obtenerLista/:id_evento_fk/:poomsae_categoria/:poomsae_genero', (req, res) => {
    const {id_evento_fk, poomsae_categoria, poomsae_genero} = req.params;
    const sql = `SELECT * FROM poomsae_resultado
                WHERE id_evento_fk = $1 AND poomsae_categoria = $2 AND poomsae_genero = $3
                ORDER BY
                CASE
                    WHEN poomsae_cinturon = 'Negro' THEN 1
                    WHEN poomsae_cinturon = 'Rojo-Negro' THEN 2
                    WHEN poomsae_cinturon = 'Rojo' THEN 3
                    WHEN poomsae_cinturon = 'Azul-Rojo' THEN 4
                    WHEN poomsae_cinturon = 'Azul' THEN 5
                    WHEN poomsae_cinturon = 'Verde-Azul' THEN 6
                    WHEN poomsae_cinturon = 'Verde' THEN 7
                    WHEN poomsae_cinturon = 'Amarillo-Verde' THEN 8
                    WHEN poomsae_cinturon = 'Amarillo' THEN 9
                    WHEN poomsae_cinturon = 'Blanco-Amarillo' THEN 10
                    WHEN poomsae_cinturon = 'Blanco' THEN 11
                    ELSE 12
                END,
                puntaje DESC`;
    db.query(sql, [id_evento_fk, poomsae_categoria, poomsae_genero], (err, result) => {
        if (err) {
            console.error("Error al obtener los resultados: ", err.message);
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        // Siempre devuelve un array, aunque esté vacío
        res.json(result.rows);
    })        
})

// Eliminar la lista de resultados
router.delete('/log/administrador/poomsae/resultados/eliminar/:id', (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM poomsae_resultado WHERE id_poomsae_resultado = $1`;
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: "Error al eliminar el resultado" });
        }
        res.json('Se eliminó correctamente el resultado');
    })
})

// Lista de resultados usuario
router.get('/evento/poomsae/resultados/listar/:id_evento_fk/:categoria/:cinturon/:genero', (req, res) => {
    const {id_evento_fk, categoria, cinturon, genero} = req.params;
    const sql = `SELECT * FROM poomsae_resultado WHERE id_evento_fk = $1 AND poomsae_categoria = $2 AND poomsae_cinturon = $3 AND poomsae_genero = $4
                ORDER BY puntaje DESC`;
    db.query(sql, [id_evento_fk, categoria, cinturon, genero], (err, result) => {
        if (err) {
            console.error("Error al obtener los resultados: ", err.message)
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        if (result.rows.length > 0) {
            res.json(result.rows)
        } else {
            res.status(404).json({ mensaje: "No hay registros" });
        }
    })
})

// Obtener competidores para premiacion
router.get('/log/administrador/poomsae/premiacion/:id_evento/:modalidad/:categoria/:genero/:nivel/:cinturon', async (req, res) => {
    try {
      const {
        id_evento,
        modalidad,
        categoria,
        genero,
        nivel,
        cinturon
      } = req.params;

      const { data, error } = await supabase.rpc(
        'get_competidores_poomsae_premiacion',
        {
          p_evento: Number(id_evento),
          p_modalidad: modalidad,
          p_categoria: categoria,
          p_genero: genero,
          p_nivel: nivel,
          p_cinturon: cinturon
        }
      );

      if (error) {
        console.error(
          'Error RPC premiación Poomsae:',
          error
        );

        return res.status(500).json({
          message:
            'Error al obtener los competidores',
          error
        });
      }

      return res.json(data || []);

    } catch (error) {
      console.error(
        'Error del servidor:',
        error
      );

      return res.status(500).json({
        message:
          'Error interno del servidor'
      });
    }
  }
);

module.exports = router;