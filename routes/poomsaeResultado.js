const express = require('express');
const dbConnect = require("../db/connect");

const router = express.Router()
const db = dbConnect();

// Para agregar los resultados a la base de datos
router.post('/log/administrador/poomsae/resultados/agregar', async (req, res) => {
    const competidores = req.body;
    if (!Array.isArray(competidores) || competidores.length === 0) {
        return res.status(400).json({ error: "Se requiere un array de competidores" });
    }
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        for (const c of competidores) {
            // 1. Insertar o actualizar en llaves_competidor_resultado
            const insertSql = `
                INSERT INTO poomsae_resultado (id_evento_fk, poomsae_categoria, poomsae_cinturon, poomsae_genero, poomsae_cedula, poomsae_nombres_competidor, poomsae_apellidos_competidor, poomsae_nombre_delegacion, resultado, puntaje, ubicacion)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (id_evento_fk, poomsae_categoria, poomsae_cinturon, poomsae_genero, poomsae_cedula, poomsae_nombres_competidor, poomsae_apellidos_competidor, poomsae_nombre_delegacion)
                DO UPDATE SET 
                    resultado = EXCLUDED.resultado,
                    puntaje = EXCLUDED.puntaje,
                    ubicacion = EXCLUDED.ubicacion`;
            const insertValues = [
                c.id_evento_fk,
                c.poomsae_categoria,
                c.poomsae_cinturon,
                c.poomsae_genero,
                c.poomsae_cedula,
                c.poomsae_nombres_competidor, 
                c.poomsae_apellidos_competidor, 
                c.poomsae_nombre_delegacion, 
                c.resultado, 
                c.puntaje,
                c.ubicacion
            ];
            await client.query(insertSql, insertValues);
            // 2. Obtener el título del evento
            const tituloQuery = `SELECT titulo_evento, id_evento, modalidad_evento, deporte_evento FROM evento WHERE id_evento = $1 LIMIT 1`;
            const { rows } = await client.query(tituloQuery, [c.id_evento_fk]);
            if (rows.length === 0) {
                throw new Error(`No se encontró el evento con id ${c.id_evento_fk}`);
            }
            const titulo_evento = rows[0].titulo_evento;
            const id_evento = rows[0].id_evento;
            const modalidad_evento = rows[0].modalidad_evento;
            const deporte_evento = rows[0].deporte_evento;
            // 3. Insertar o actualizar en historial_resultado_poomsae
            const historialSql = `
                INSERT INTO historial_resultado_poomsae (titulo_evento, poomsae_categoria, poomsae_cinturon, poomsae_genero, poomsae_cedula, poomsae_nombres_competidor, poomsae_apellidos_competidor, poomsae_nombre_delegacion, resultado, ubicacion, id_evento, modalidad_evento, deporte_evento)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (titulo_evento, poomsae_categoria, poomsae_cinturon, poomsae_genero, poomsae_cedula, poomsae_nombres_competidor, poomsae_apellidos_competidor, poomsae_nombre_delegacion, id_evento, modalidad_evento, deporte_evento)
                DO UPDATE SET 
                    resultado = EXCLUDED.resultado,
                    ubicacion = EXCLUDED.ubicacion`;
            const historialValues = [
                titulo_evento,
                c.poomsae_categoria,
                c.poomsae_cinturon,
                c.poomsae_genero,
                c.poomsae_cedula,
                c.poomsae_nombres_competidor, 
                c.poomsae_apellidos_competidor, 
                c.poomsae_nombre_delegacion, 
                c.resultado, 
                c.ubicacion,
                id_evento,
                modalidad_evento,
                deporte_evento
            ];

            await client.query(historialSql, historialValues);
        }
        await client.query('COMMIT');

        res.status(200).send({
            message: 'Resultados agregados y actualizados correctamente en ambas tablas',
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al procesar resultados:', error);
        res.status(500).send('Error al guardar los datos en la base de datos');
    } finally {
        client.release();
    }

})

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

module.exports = router;