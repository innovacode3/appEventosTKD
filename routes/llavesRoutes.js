const express = require('express');
const { generateTournamentTree } = require("../services/llavesService");
const dbConnect = require("../db/connect");

const router = express.Router();
const db = dbConnect();

//Generar arbol con los datos de la bd
router.get('/log/administrador/generar-llaves/:id_evento_fk/:genero/:nivel/:nombre_categoria/:peso_categoria', (req, res) => {
    const { id_evento_fk, genero, nivel, nombre_categoria, peso_categoria } = req.params;
    const sql = `
        SELECT UPPER(r.nombres_suscrito_alumno_evento) AS nombres_suscrito_alumno_evento, 
               UPPER(r.apellidos_suscrito_alumno_evento) AS apellidos_suscrito_alumno_evento,
               d.nombre_corto_delegacion
        FROM suscrito_alumno_evento r
        JOIN registro_delegacion d ON r.id_delegacion_fk = d.id_delegacion
        WHERE r.id_evento_fk = $1 
          AND r.genero_suscrito_alumno_evento = $2
          AND r.nivel_suscrito_alumno_evento = $3 
          AND r.nombre_categoria_alumno_evento = $4 
          AND r.peso_categoria_suscrito_alumno_evento = $5 
        ORDER BY
          RANDOM();`;
    db.query(sql, [id_evento_fk, genero, nivel, nombre_categoria, peso_categoria], (err, result) => {
        if (err) {
            console.error('Error al obtener competidores:', err);
            return res.status(500).send('Error interno del servidor');
        }
        const nombresCompetidores = result.rows.map(row => 
            `${row.nombres_suscrito_alumno_evento} ${row.apellidos_suscrito_alumno_evento}    ${row.nombre_corto_delegacion}`
        );
        if (nombresCompetidores.length < 1) {
            return res.status(404).send('No hay competidores en la base de datos.');
        }
        const treeStructure = generateTournamentTree(nombresCompetidores);
        if (!treeStructure) {
            return res.status(404).send('Plantilla no encontrada.');
        }
        res.json(treeStructure);
    });
});

// Obtener total de competidores en esa llave
router.get('/log/administrador/generar-llaves/obtenerTotal/:id_evento_fk/:genero/:nivel/:nombre_categoria/:peso_categoria', (req, res) => {
    const { id_evento_fk, genero, nivel, nombre_categoria, peso_categoria } = req.params;
    const sql = `
        SELECT COUNT(*) AS total_competidores
        FROM suscrito_alumno_evento r
        JOIN registro_delegacion d ON r.id_delegacion_fk = d.id_delegacion
        WHERE r.id_evento_fk = $1 
          AND r.genero_suscrito_alumno_evento = $2
          AND r.nivel_suscrito_alumno_evento = $3 
          AND r.nombre_categoria_alumno_evento = $4 
          AND r.peso_categoria_suscrito_alumno_evento = $5`;
    db.query(sql, [id_evento_fk, genero, nivel, nombre_categoria, peso_categoria], (err, result) => {
        if (err) {
            console.error('Error al obtener el total de competidores:', err);
            return res.status(500).send('Error interno del servidor');
        }
        if (result.rows.length > 0) {
            res.json(result.rows[0].total_competidores);
        } else {
            res.status(404).json({ mensaje: "No se puede contabilizar" });
        }
    });
});

//Obtener las categorias para crear las llaves
router.get('/log/administrador/generarLlaves/obtenerCategorias/:id_evento/:genero/:nivel', (req, res) => {
    const {id_evento, genero, nivel} = req.params;
    const sql = `SELECT DISTINCT nombre_categoria_alumno_evento FROM suscrito_alumno_evento
                 WHERE id_evento_fk = $1
                 AND genero_suscrito_alumno_evento = $2
                 AND nivel_suscrito_alumno_evento = $3`;
    db.query(sql, [id_evento, genero, nivel], (err, result) => {
        if (err) {
            console.error("Error al obtener las categorías de las llaves: ", err.message);
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        if (result.rows.length > 0) {
            res.json(result.rows);
        } else {
            res.status(404).json({ mensaje: "No hay registros" });
        }
    })
})

//Obtener pesos categorias para crear las llaves
router.get('/log/administrador/generarLlaves/obtenerPesosCategoriasLlaves/:id_evento_fk/:genero/:nivel/:categoria', (req, res) => {
    const { id_evento_fk, genero, nivel, categoria} = req.params;
    const sql = `SELECT  DISTINCT peso_categoria_suscrito_alumno_evento FROM suscrito_alumno_evento
                 WHERE id_evento_fk = $1
                 AND genero_suscrito_alumno_evento = $2
                 AND nivel_suscrito_alumno_evento = $3
                 AND nombre_categoria_alumno_evento = $4`;
    db.query(sql, [id_evento_fk, genero, nivel, categoria], (err, result) => {
        if (err) {
            console.error("Error al obtener los pesos de las llaves: ", err.message);
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        if (result.rows.length > 0) {
            res.json(result.rows);
        } else {
            res.status(404).json({ mensaje: "No hay registros" });
        }
    })
})

// Obtener lista para premiaciones
router.get('/log/administrador/generar-llaves/obtenerTotal/premiacion/:id_evento_fk/:genero/:nivel/:nombre_categoria/:peso_categoria', (req, res) => {
    const { id_evento_fk, genero, nivel, nombre_categoria, peso_categoria } = req.params;
    const sql = `
        SELECT r.cedula_suscrito_alumno_evento,
               r.nombres_suscrito_alumno_evento, 
               r.apellidos_suscrito_alumno_evento, 
               d.nombre_delegacion
        FROM suscrito_alumno_evento r
        JOIN registro_delegacion d ON r.id_delegacion_fk = d.id_delegacion
        WHERE r.id_evento_fk = $1 
          AND r.genero_suscrito_alumno_evento = $2
          AND r.nivel_suscrito_alumno_evento = $3 
          AND r.nombre_categoria_alumno_evento = $4 
          AND r.peso_categoria_suscrito_alumno_evento = $5;`;
    db.query(sql, [id_evento_fk, genero, nivel, nombre_categoria, peso_categoria], (err, result) => {
        if (err) {
            console.error('Error al obtener los competidores:', err);
            return res.status(500).send('Error interno del servidor');
        }
        res.json(result.rows.length > 0 ? result.rows : []);
    });
});

// Obtener competidores de las llaves creadas
router.get('/log/administrador/obtenerCompetidores/:id_evento_fk/:nivel/:nombre_categoria/:peso_categoria/:genero', (req, res) => {
    const { id_evento_fk, nivel, nombre_categoria, peso_categoria, genero } = req.params;
    const sql = `
        SELECT r.nombres_suscrito_alumno_evento, 
               r.apellidos_suscrito_alumno_evento, 
               r.peso_suscrito_alumno_evento,
               d.nombre_delegacion
        FROM suscrito_alumno_evento r
        JOIN registro_delegacion d ON r.id_delegacion_fk = d.id_delegacion
        WHERE r.id_evento_fk = $1 
          AND r.nivel_suscrito_alumno_evento = $2 
          AND r.nombre_categoria_alumno_evento = $3 
          AND r.peso_categoria_suscrito_alumno_evento = $4 
          AND r.genero_suscrito_alumno_evento = $5;`;
    db.query(sql, [id_evento_fk, nivel, nombre_categoria, peso_categoria, genero], (err, result) => {
        if (err) {
            console.error('Error al obtener los competidores:', err);
            return res.status(500).send('Error interno del servidor');
        }
        res.json(result.rows.length > 0 ? result.rows : []);
    });
});

//Obtener la imagen de las llaves y los nombres de los competidores
router.get('/log/administrador/obtenerLLavesyCompetidores/:id_evento_fk/:nivel/:nombre_categoria/:peso_categoria/:genero', (req, res) => {
    const { id_evento_fk, nivel, nombre_categoria, peso_categoria, genero } = req.params;
    const sql = `
        SELECT p.url_imagen_llaves,
               p.total_competidores_llaves,
               r.nombres_suscrito_alumno_evento,
               r.apellidos_suscrito_alumno_evento,
               d.nombre_delegacion
        FROM presentacion_llaves p
        INNER JOIN suscrito_alumno_evento r 
            ON p.id_evento_fk = r.id_evento_fk
            AND p.nivel = r.nivel_suscrito_alumno_evento
            AND p.nombre_categoria = r.nombre_categoria_alumno_evento
            AND p.peso_categoria = r.peso_categoria_suscrito_alumno_evento
            AND p.genero = r.genero_suscrito_alumno_evento
        INNER JOIN registro_delegacion d ON r.id_delegacion_fk = d.id_delegacion
        WHERE r.id_evento_fk = $1 
          AND r.nivel_suscrito_alumno_evento = $2 
          AND r.nombre_categoria_alumno_evento = $3 
          AND r.peso_categoria_suscrito_alumno_evento = $4 
          AND r.genero_suscrito_alumno_evento = $5;`
    db.query(sql, [id_evento_fk, nivel, nombre_categoria, peso_categoria, genero], (err, result) => {
        if (err) {
            console.error('Error al obtener los competidores:', err);
            return res.status(500).send('Error interno del servidor');
        }
        res.json(result.rows.length > 0 ? result.rows : []);
    })
})

module.exports = router;
