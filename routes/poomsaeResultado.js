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

// Para obtener modalidades
router.get('/log/administrador/poomsae/resultados/modalidades/:id_evento', async (req, res) => {
    try {
      const { id_evento } = req.params;

      const { data, error } = await supabase.rpc(
        'obtener_modalidades_resultados_poomsae',
        {
          p_id_evento: Number(id_evento)
        }
      );

      if (error) {
        console.error(
          'Error modalidades Poomsae:',
          error
        );

        return res.status(500).json({
          message:
            'No se pudieron obtener las modalidades.'
        });
      }

      const modalidades = (data || []).map(
        item => item.modalidad
      );

      return res.json(modalidades);

    } catch (error) {
      console.error(
        'Error del servidor:',
        error
      );

      return res.status(500).json({
        message:
          'Error interno del servidor.'
      });
    }
  }
);

// Para obtener categorias
router.get('/log/administrador/poomsae/resultados/categorias/:id_evento/:modalidad', async (req, res) => {
    try {
      const {
        id_evento,
        modalidad
      } = req.params;

      const { data, error } = await supabase.rpc(
        'obtener_categorias_resultados_poomsae',
        {
          p_id_evento: Number(id_evento),
          p_modalidad: modalidad
        }
      );

      if (error) {
        console.error(
          'Error categorías Poomsae:',
          error
        );

        return res.status(500).json({
          message:
            'No se pudieron obtener las categorías.'
        });
      }

      const categorias = (data || []).map(
        item => item.categoria
      );

      return res.json(categorias);

    } catch (error) {
      console.error(
        'Error del servidor:',
        error
      );

      return res.status(500).json({
        message:
          'Error interno del servidor.'
      });
    }
  }
);


// Lista de resultados
router.get('/log/administrador/poomsae/resultados/obtenerLista/:id_evento/:modalidad/:categoria', async (req, res) => {
    try {
      const {
        id_evento,
        modalidad,
        categoria
      } = req.params;

      const { data, error } = await supabase.rpc(
        'obtener_lista_resultados_poomsae',
        {
          p_id_evento: Number(id_evento),
          p_modalidad: modalidad,
          p_categoria: categoria
        }
      );

      if (error) {
        console.error(
          'Error listado resultados Poomsae:',
          error
        );

        return res.status(500).json({
          message:
            'No se pudieron obtener los resultados.'
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
          'Error interno del servidor.'
      });
    }
  }
);

// Eliminar individual
router.delete('/log/administrador/poomsae/resultados/eliminar/individual/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase.rpc(
        'eliminar_resultado_poomsae_individual',
        {
          p_id_resultado: Number(id)
        }
      );

      if (error) {
        console.error(
          'Error eliminando resultado individual:',
          error
        );

        return res.status(500).json({
          message:
            error.message ||
            'No se pudo eliminar el resultado.'
        });
      }

      return res.json(data);

    } catch (error) {
      console.error(
        'Error del servidor:',
        error
      );

      return res.status(500).json({
        message:
          'Error interno del servidor.'
      });
    }
  }
);

// Eliminar mixto o equipo
router.delete('/log/administrador/poomsae/resultados/eliminar/equipo/:id_evento/:equipo_id', async (req, res) => {
    try {
      const {
        id_evento,
        equipo_id
      } = req.params;

      const { data, error } = await supabase.rpc(
        'eliminar_resultado_poomsae_equipo',
        {
          p_id_evento: Number(id_evento),
          p_equipo_id: equipo_id
        }
      );

      if (error) {
        console.error(
          'Error eliminando equipo Poomsae:',
          error
        );

        return res.status(500).json({
          message:
            error.message ||
            'No se pudo eliminar el equipo.'
        });
      }

      return res.json(data);

    } catch (error) {
      console.error(
        'Error del servidor:',
        error
      );

      return res.status(500).json({
        message:
          'Error interno del servidor.'
      });
    }
  }
);

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

//Obtener resultados publico y logueado
router.get(
  '/evento/poomsae/resultados/:id_evento/:modalidad/:categoria/:genero/:nivel/:cinturon',
  async (req, res) => {
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
        'obtener_resultados_publicos_poomsae',
        {
          p_id_evento: Number(id_evento),
          p_modalidad: modalidad,
          p_categoria: categoria,
          p_genero: genero,
          p_nivel: nivel,
          p_cinturon: cinturon
        }
      );

      if (error) {
        console.error(
          'Error obteniendo resultados públicos:',
          error
        );

        return res.status(500).json({
          message:
            'No se pudieron obtener los resultados.'
        });
      }

      return res.json(data || []);

    } catch (error) {
      console.error(
        'Error interno resultados Poomsae:',
        error
      );

      return res.status(500).json({
        message:
          'Error interno del servidor.'
      });
    }
  }
);

//Listar los resultados publico-logueado
router.get('/evento/poomsae/resultados/:id_evento/:modalidad/:categoria/:genero/:nivel/:cinturon', async (req, res) => {
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
        'obtener_resultados_publicos_poomsae',
        {
          p_id_evento: Number(id_evento),
          p_modalidad: modalidad,
          p_categoria: categoria,
          p_genero: genero,
          p_nivel: nivel,
          p_cinturon: cinturon
        }
      );

      if (error) {
        console.error(
          'Error obteniendo resultados públicos:',
          error
        );

        return res.status(500).json({
          message:
            'No se pudieron obtener los resultados.'
        });
      }

      return res.json(data || []);

    } catch (error) {
      console.error(
        'Error interno resultados Poomsae:',
        error
      );

      return res.status(500).json({
        message:
          'Error interno del servidor.'
      });
    }
  }
);

module.exports = router;