const express = require('express');
const router = express.Router();
//llamada a la conexión de la base de datos de supabase
const supabase = require('../db/supabaseClient');

//Obtener alumnos inscritos
router.get('/log/delegacion/evento/combate/alumnoInscripcion/:id_evento_fk/:id_delegacion_fk', async (req, res) => {
  const { id_evento_fk, id_delegacion_fk } = req.params;
  try {
      const { data, error } = await supabase
          .from('suscrito_alumno_evento')
          .select('*')
          .eq('id_evento_fk', id_evento_fk)
          .eq('id_delegacion_fk', id_delegacion_fk);
      if (error) {
          console.error("Error al obtener alumnos inscritos:", error.message);
          return res.status(500).json({ error: "Error al obtener los datos" });
      }
      res.json(data);
  } catch (err) {
      res.status(500).json({ error: err.message || err });
  }
});

//Obtener un alumno inscrito
router.get('/log/delegacion/evento/combate/ObteneralumnoInscripcion/:id_evento_fk/:id', async (req, res) => {
  const { id_evento_fk, id } = req.params;
  try {
      const { data, error } = await supabase
          .from('suscrito_alumno_evento')
          .select('*')
          .eq('id_evento_fk', id_evento_fk)
          .eq('id_suscrito_alumno_evento', id)
          .single();
      if (error) {
          console.error("Error al obtener alumno:", error.message);
          return res.status(500).json({ error: "Error al obtener los datos" });
      }
      if (!data) {
          return res.status(404).json({ mensaje: 'No hay registro con ese ID' });
      }
      res.json(data);
  } catch (err) {
      res.status(500).json({ error: err.message || err });
  }
});

//Obtener las inscripciones pero por la cedula
router.get('/log/delegacion/evento/combate/alumnoInscripcion/buscarCedula/:id_evento_fk/:id_delegacion_fk/:cedula', async (req, res) => {
  const { id_evento_fk, id_delegacion_fk, cedula } = req.params;

  try {
    const { data, error } = await supabase
      .from('suscrito_alumno_evento')
      .select('*')
      .eq('id_evento_fk', id_evento_fk)
      .eq('id_delegacion_fk', id_delegacion_fk)
      .eq('cedula_suscrito_alumno_evento', cedula);

    if (error) {
      console.error("Error al obtener alumno:", error.message);
      return res.status(500).json({ error: "Error al obtener los datos" });
    }

    // ✅ SIEMPRE devolver array (aunque esté vacío)
    return res.json(data || []);

  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
});

// Verificar si el alumno ya está inscrito por cédula
router.get('/log/delegacion/evento/combate/alumnoInscripcion/ced/:id_evento_fk/:cedula', async (req, res) => {
  const { id_evento_fk, cedula } = req.params;
  try {
    const { data, error } = await supabase
        .from('suscrito_alumno_evento')
        .select('cedula_suscrito_alumno_evento')
        .eq('id_evento_fk', id_evento_fk)
        .eq('cedula_suscrito_alumno_evento', cedula);
    if (error) {
        console.error("Error al obtener alumno:", error.message);
        return res.status(500).json({ error: "Error al obtener los datos" });
    }
    // Si existe un registro -> true, si no -> false
    const existe = data && data.length > 0;
    return res.json(existe);
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

//Insertar alumno inscrito
router.post('/log/delegacion/evento/combate/alumnoInscripcion/agregar', async (req, res) => {
  const alumnoInscripcion = {
      cedula_suscrito_alumno_evento: req.body.cedula_suscrito_alumno_evento,
      id_evento_fk: req.body.id_evento_fk,
      id_delegacion_fk: req.body.id_delegacion_fk,
      nombres_suscrito_alumno_evento: req.body.nombres_suscrito_alumno_evento,
      apellidos_suscrito_alumno_evento: req.body.apellidos_suscrito_alumno_evento,
      edad_suscrito_alumno_evento: req.body.edad_suscrito_alumno_evento,
      nombre_categoria_alumno_evento: req.body.nombre_categoria_alumno_evento,
      genero_suscrito_alumno_evento: req.body.genero_suscrito_alumno_evento,
      cinturon_suscrito_alumno_evento: req.body.cinturon_suscrito_alumno_evento,
      peso_suscrito_alumno_evento: req.body.peso_suscrito_alumno_evento,
      peso_categoria_suscrito_alumno_evento: req.body.peso_categoria_suscrito_alumno_evento,
      nivel_suscrito_alumno_evento: req.body.nivel_suscrito_alumno_evento,
      fnacimiento_suscrito_alumno_evento: req.body.fnacimiento_suscrito_alumno_evento
  };

  try {
    const { data, error } = await supabase
        .from('suscrito_alumno_evento')
        .insert([alumnoInscripcion]);
    if (error) {
        console.error("Error al insertar alumno:", error.message);
        return res.status(500).json({ error: "Error al insertar los datos" });
    }
    res.json({ message: "Se insertó correctamente el usuario" });
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

//Editar alumno inscrito existente
router.put('/log/delegacion/evento/combate/alumnoInscripcion/actualizar/:id', async (req, res) => {
  const { id } = req.params;
  const {
    cedula_suscrito_alumno_evento,
    id_evento_fk,
    id_delegacion_fk,
    nombres_suscrito_alumno_evento,
    apellidos_suscrito_alumno_evento,
    edad_suscrito_alumno_evento,
    nombre_categoria_alumno_evento,
    genero_suscrito_alumno_evento,
    cinturon_suscrito_alumno_evento,
    peso_suscrito_alumno_evento,
    peso_categoria_suscrito_alumno_evento,
    nivel_suscrito_alumno_evento,
    fnacimiento_suscrito_alumno_evento
  } = req.body;

  try {
      const { error } = await supabase
        .from('suscrito_alumno_evento')
        .update({
            cedula_suscrito_alumno_evento,
            id_evento_fk,
            id_delegacion_fk,
            nombres_suscrito_alumno_evento,
            apellidos_suscrito_alumno_evento,
            edad_suscrito_alumno_evento,
            nombre_categoria_alumno_evento,
            genero_suscrito_alumno_evento,
            cinturon_suscrito_alumno_evento,
            peso_suscrito_alumno_evento,
            peso_categoria_suscrito_alumno_evento,
            nivel_suscrito_alumno_evento,
            fnacimiento_suscrito_alumno_evento
        })
        .eq('id_suscrito_alumno_evento', id);
      if (error) {
          console.error("Error al actualizar alumno:", error.message);
          return res.status(500).json({ error: "Error al actualizar los datos" });
      }
      res.json({ message: "Se actualizó correctamente el alumno inscrito" });
  } catch (err) {
      res.status(500).json({ error: err.message || err });
  }
});


//Eliminar alumno inscrito existente
router.delete('/log/delegacion/evento/combate/alumnoInscripcion/eliminar/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
        .from('suscrito_alumno_evento')
        .delete()
        .eq('id_suscrito_alumno_evento', id);
    if (error) {
        console.error("Error al eliminar alumno:", error.message);
        return res.status(500).json({ error: "Error al eliminar los datos" });
    }
    res.json({ message: "Se eliminó correctamente el alumno inscrito" });
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});


module.exports = router;
