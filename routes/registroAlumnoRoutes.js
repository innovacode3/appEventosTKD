const express = require('express');
const dbConnect = require("../db/connect");

const router = express.Router();
const db = dbConnect();

//Obtener alumnos
router.get('/log/delegacion/registro_alumno', (req, res) => {
    const sql = 'SELECT id_alumno, nombre_alumno, apellido_alumno, cedula_alumno, fecha_nacimiento_alumno, edad_alumno, genero_alumno, cinturon_alumno FROM registro_alumno';
    db.query(sql, (err, result) => {
        if (err) {
            console.error("Error al obtener alumnos: ", err.message);
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        if (result.rows.length > 0) {
            res.json(result.rows);  // Usamos `result.rows` en PostgreSQL
        } else {
            res.status(404).json({ mensaje: "No hay registros" });
        }
    });
});


//Obtener un alumno
router.get('/log/delegacion/registro_alumno/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT id_alumno, nombre_alumno, apellido_alumno, cedula_alumno, fecha_nacimiento_alumno, edad_alumno, genero_alumno, telefono_alumno, cinturon_alumno FROM registro_alumno WHERE id_alumno = $1';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error al obtener alumno: ", err.message);
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        if (result.rows.length > 0) {
            res.json(result.rows[0]); // Usamos `result.rows` para obtener el primer elemento
        } else {
            res.status(404).json({ mensaje: "No hay registros" });
        }
    });
});


//Obtener un alumno por cédula
router.get('/log/delegacion/registro_alumno/ced/:cedula', (req, res) => {
    const { cedula } = req.params;
    const sql = 'SELECT id_alumno, id_delegacion_fk, nombre_alumno, apellido_alumno, cedula_alumno, fecha_nacimiento_alumno, edad_alumno, genero_alumno, cinturon_alumno FROM registro_alumno WHERE cedula_alumno = $1';
    db.query(sql, [cedula], (err, result) => {
        if (err) {
            console.error("Error al obtener alumno: ", err.message);
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        if (result.rows.length > 0) {
            res.json(result.rows[0]); // Usamos `result.rows` para acceder a los datos
        } else {
            res.status(404).json({ mensaje: "No hay registros" });
        }
    });
});


//Obtener nombre delegacion logueada mediante el id => utilizamos el Join mediante la FK
router.get('/log/delegacion/registro_alumno/id_delegacion/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT d.nombre_delegacion
        FROM registro_alumno r
        JOIN registro_delegacion d ON r.id_delegacion_fk = d.id_delegacion
        WHERE r.id_alumno = $1`;
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error al obtener la delegación: ", err.message);
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        if (result.rows.length > 0) {
            res.json(result.rows[0]); // Accedemos al primer resultado con `result.rows`
        } else {
            res.status(404).json({ mensaje: "No hay registros" });
        }
    });
});



module.exports = router;