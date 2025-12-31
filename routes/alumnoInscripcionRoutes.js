const express = require('express');
const dbConnect = require("../db/connect");

const router = express.Router();
const db = dbConnect();

//Obtener alumnos inscritos
router.get('/log/delegacion/evento/combate/alumnoInscripcion/:id_evento_fk/:id_delegacion_fk', (req, res) => {
    const { id_evento_fk, id_delegacion_fk } = req.params;
    const sql = `SELECT * FROM suscrito_alumno_evento 
                 WHERE id_evento_fk = $1 AND id_delegacion_fk = $2
                `;
    db.query(sql, [id_evento_fk, id_delegacion_fk], (err, result) => {
      if (err) {
        console.error('Error al obtener alumnos inscritos:', err.message);
        return res.status(500).json({ error: 'Error al obtener los datos' });
      }
      res.json(result.rows);
    });
});

//Obtener un alumno inscrito
router.get('/log/delegacion/evento/combate/ObteneralumnoInscripcion/:id_evento_fk/:id', (req, res) => {
    const { id_evento_fk, id } = req.params;
    const sql = `SELECT * FROM suscrito_alumno_evento WHERE id_evento_fk = $1 AND id_suscrito_alumno_evento = $2`;
    db.query(sql, [id_evento_fk, id], (err, result) => {
      if (err) {
        console.error('Error al obtener alumno:', err.message);
        return res.status(500).json({ error: 'Error al obtener los datos' });
      }
  
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ mensaje: 'No hay registro con ese ID' });
      }
    });
});

//Obtener las inscripciones pero por la cedula
router.get('/log/delegacion/evento/combate/alumnoInscripcion/buscarCedula/:id_evento_fk/:cedula', (req, res) => {
    const { id_evento_fk, cedula } = req.params;
    const sql = `SELECT * FROM suscrito_alumno_evento WHERE id_evento_fk = $1 AND cedula_suscrito_alumno_evento = $2`; 
    db.query(sql, [id_evento_fk, cedula], (err, result) => {
      if (err) {
        console.error('Error al obtener alumno:', err.message);
        return res.status(500).json({ error: 'Error al obtener los datos' });
      }
      if (result.rows.length > 0) {
        res.json(result.rows);
      } else {
        res.status(404).json({ mensaje: 'No hay registro con esa cédula' });
      }
    });
});
// Verificar si el alumno ya está inscrito por cédula
router.get('/log/delegacion/evento/combate/alumnoInscripcion/ced/:id_evento_fk/:cedula', (req, res) => {
    const { id_evento_fk, cedula } = req.params;
    const sql = `SELECT cedula_suscrito_alumno_evento FROM suscrito_alumno_evento WHERE id_evento_fk= $1 AND cedula_suscrito_alumno_evento = $2`;
  
    db.query(sql, [id_evento_fk, cedula], (err, result) => {
      if (err) {
        console.error('Error al obtener alumno:', err.message);
        return res.status(500).json({ error: 'Error al obtener los datos' });
      }
  
      if (result.rows.length > 0) {
        // Si existe un alumno con esa cédula, respondemos que está inscrito
        return res.json(true);
      } else {
        // Si no se encuentra ningún alumno, respondemos que no está inscrito
        return res.json(false);
      }
    });
});

//Insertar alumno inscrito
router.post('/log/delegacion/evento/combate/alumnoInscripcion/agregar', (req, res) => {
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
    }
    const sql = `
        INSERT INTO suscrito_alumno_evento(
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
        )
        VALUES(
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        )`;
    const values = [
        alumnoInscripcion.cedula_suscrito_alumno_evento,
        alumnoInscripcion.id_evento_fk,
        alumnoInscripcion.id_delegacion_fk,
        alumnoInscripcion.nombres_suscrito_alumno_evento,
        alumnoInscripcion.apellidos_suscrito_alumno_evento,
        alumnoInscripcion.edad_suscrito_alumno_evento,
        alumnoInscripcion.nombre_categoria_alumno_evento,
        alumnoInscripcion.genero_suscrito_alumno_evento,
        alumnoInscripcion.cinturon_suscrito_alumno_evento,
        alumnoInscripcion.peso_suscrito_alumno_evento,
        alumnoInscripcion.peso_categoria_suscrito_alumno_evento,
        alumnoInscripcion.nivel_suscrito_alumno_evento,
        alumnoInscripcion.fnacimiento_suscrito_alumno_evento
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Error al insertar los datos' });
        }

        res.json('Se insertó correctamente el usuario');
    });
});

//Editar alumno inscrito existente
router.put('/log/delegacion/evento/combate/alumnoInscripcion/actualizar/:id', (req, res) => {
    const { id } = req.params;
    const { cedula_suscrito_alumno_evento, id_evento_fk, id_delegacion_fk, nombres_suscrito_alumno_evento, apellidos_suscrito_alumno_evento, edad_suscrito_alumno_evento, nombre_categoria_alumno_evento, genero_suscrito_alumno_evento, cinturon_suscrito_alumno_evento, peso_suscrito_alumno_evento, peso_categoria_suscrito_alumno_evento, nivel_suscrito_alumno_evento, fnacimiento_suscrito_alumno_evento } = req.body;
    const sql = `
        UPDATE suscrito_alumno_evento
        SET
            cedula_suscrito_alumno_evento = $1,
            id_evento_fk = $2,
            id_delegacion_fk = $3,
            nombres_suscrito_alumno_evento = $4,
            apellidos_suscrito_alumno_evento = $5,
            edad_suscrito_alumno_evento = $6,
            nombre_categoria_alumno_evento = $7,
            genero_suscrito_alumno_evento = $8,
            cinturon_suscrito_alumno_evento = $9,
            peso_suscrito_alumno_evento = $10,
            peso_categoria_suscrito_alumno_evento = $11,
            nivel_suscrito_alumno_evento = $12,
            fnacimiento_suscrito_alumno_evento = $13
        WHERE id_suscrito_alumno_evento = $14`;
    const values = [
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
        fnacimiento_suscrito_alumno_evento,
        id
    ];
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Error al actualizar los datos' });
        }
        res.json('Se actualizó correctamente el alumno inscrito');
    });
});

//Eliminar alumno inscrito existente
router.delete('/log/delegacion/evento/combate/alumnoInscripcion/eliminar/:id', (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM suscrito_alumno_evento WHERE id_suscrito_alumno_evento = $1`;  
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Error al eliminar los datos' });
        }
        res.json('Se eliminó correctamente el alumno inscrito');
    });
});

module.exports = router;
