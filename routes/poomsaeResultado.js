const express = require('express');
const dbConnect = require("../db/connect");

const router = express.Router()
const db = dbConnect();
// conexión supabase
const supabase = require('../db/supabaseClient');

// Helper
function normalizarResultadosPoomsae(
  competidores
) {
  const modalidadesGrupales = new Set([
    'Mixto',
    'Equipo',
    'Freestyle-Mixto',
    'Freestyle-Equipo'
  ]);

  const equiposConPuntaje = new Set();

  return competidores.map(competidor => {
    const modalidad =
      String(
        competidor.poomsae_modalidad || ''
      ).trim();

    const esGrupal =
      modalidadesGrupales.has(modalidad);

    const equipoId =
      competidor.equipo_id || null;

    let puntaje =
      Number(competidor.puntaje || 0);

    if (!Number.isFinite(puntaje)) {
      puntaje = 0;
    }

    if (esGrupal) {
      if (!equipoId) {
        throw new Error(
          `La modalidad ${modalidad} requiere equipo_id`
        );
      }

      if (equiposConPuntaje.has(equipoId)) {
        puntaje = 0;
      } else if (puntaje > 0) {
        equiposConPuntaje.add(equipoId);
      }
    }

    return {
      id_evento_fk:
        Number(competidor.id_evento_fk),

      poomsae_categoria:
        competidor.poomsae_categoria,

      poomsae_cinturon:
        competidor.poomsae_cinturon,

      poomsae_genero:
        competidor.poomsae_genero,

      poomsae_cedula:
        competidor.poomsae_cedula,

      puntaje,

      ubicacion:
        competidor.ubicacion || 'NADA',

      poomsae_modalidad:
        modalidad,

      equipo_id:
        equipoId,

      posicion:
        competidor.posicion === null ||
        competidor.posicion === undefined
          ? null
          : Number(competidor.posicion),

      nivel_poomsae:
        competidor.nivel_poomsae,

      poomsae_nombres:
        competidor.poomsae_nombres,

      poomsae_apellidos:
        competidor.poomsae_apellidos,

      poomsae_nombre_delegacion:
        competidor.poomsae_nombre_delegacion
    };
  });
}

// Para agregar los resultados a la base de datos
router.post('/log/administrador/poomsae/resultados/agregar', async (req, res) => {
    try {
      const competidores = req.body;

      if (
        !Array.isArray(competidores) ||
        competidores.length === 0
      ) {
        return res.status(400).json({
          message: 'Se requiere un arreglo de resultados'
        });
      }

      const idEvento = Number(
        competidores[0].id_evento_fk
      );

      if (!Number.isInteger(idEvento)) {
        return res.status(400).json({
          message: 'El identificador del evento no es válido'
        });
      }

      const eventoInconsistente = competidores.some(
        competidor =>
          Number(competidor.id_evento_fk) !== idEvento
      );

      if (eventoInconsistente) {
        return res.status(400).json({
          message:
            'Todos los resultados deben pertenecer al mismo evento'
        });
      }

      const resultadosNormalizados =
        normalizarResultadosPoomsae(competidores);

      const { data, error } = await supabase.rpc(
        'guardar_resultados_poomsae',
        {
          p_id_evento: idEvento,
          p_resultados: resultadosNormalizados
        }
      );

      if (error) {
        console.error(
          'Error RPC guardar_resultados_poomsae:',
          error
        );

        return res.status(500).json({
          message:
            'Error al guardar los resultados de Poomsae',
          error
        });
      }

      return res.status(200).json({
        message:
          'Resultados de Poomsae guardados correctamente',
        data
      });

    } catch (error) {
      console.error(
        'Error del servidor al guardar Poomsae:',
        error
      );

      return res.status(500).json({
        message: 'Error interno del servidor'
      });
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