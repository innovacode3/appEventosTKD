const express = require('express');
const dbConnect = require("../db/connect");

const router = express.Router()
const db = dbConnect();

// Obtener la lista de resultados
/*router.get('/log/administrador/resultadosCompetidor/obtenerResultados/:id_evento_fk/:nivel/:nombre_categoria/:peso_categoria/:genero', (req, res) => {
    const { id_evento_fk, nivel, nombre_categoria, peso_categoria, genero } = req.params;

    const sql = `SELECT * FROM llaves_competidor_resultado WHERE id_evento_fk = $1 AND nivel = $2 AND nombre_categoria = $3
                AND peso_categoria = $4 AND genero = $5 AND ubicacion != 'NADA'
                ORDER BY 
                    puntaje DESC,
                    CASE 
                        WHEN ubicacion = 'PRIMER LUGAR' THEN 'PRIMER LUGAR 🥇'
                        WHEN ubicacion = 'SEGUNDO LUGAR' THEN 'SEGUNDO LUGAR 🥈'
                        WHEN ubicacion = 'TERCER LUGAR' THEN 'TERCER LUGAR 🥉'
                        WHEN ubicacion = 'CUARTO LUGAR' THEN 'CUARTO LUGAR 🏅'
                        ELSE 5
                    END ASC`

    db.query(sql, [id_evento_fk, nivel, nombre_categoria, peso_categoria, genero], (err, result) => {
        if (err) {
            console.error("Error al obtener los resultados: ", err.message)
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        res.json(result.rows)
    })
})*/

router.get('/log/administrador/resultadosCompetidor/obtenerResultados/:id_evento_fk/:nivel/:nombre_categoria/:peso_categoria/:genero', (req, res) => {
    const { id_evento_fk, nivel, nombre_categoria, peso_categoria, genero } = req.params;

    const sql = `
        SELECT 
            *,
            CASE 
                WHEN ubicacion = 'PRIMER LUGAR' THEN 'PRIMER LUGAR 🥇'
                WHEN ubicacion = 'SEGUNDO LUGAR' THEN 'SEGUNDO LUGAR 🥈'
                WHEN ubicacion = 'TERCER LUGAR' THEN 'TERCER LUGAR 🥉'
                WHEN ubicacion = 'CUARTO LUGAR' THEN 'CUARTO LUGAR 🏅'
                WHEN ubicacion = 'NADA' THEN 'SIN POSICIÓN'
                ELSE ubicacion
            END AS ubicacion
        FROM llaves_competidor_resultado
        WHERE id_evento_fk = $1 AND nivel = $2 AND nombre_categoria = $3
              AND peso_categoria = $4 AND genero = $5
        ORDER BY
            puntaje DESC,
            CASE 
                WHEN ubicacion = 'PRIMER LUGAR' THEN 1
                WHEN ubicacion = 'SEGUNDO LUGAR' THEN 2
                WHEN ubicacion = 'TERCER LUGAR' THEN 3
                WHEN ubicacion = 'CUARTO LUGAR' THEN 4
                ELSE 5
            END ASC
    `;

    db.query(sql, [id_evento_fk, nivel, nombre_categoria, peso_categoria, genero], (err, result) => {
        if (err) {
            console.error("Error al obtener los resultados: ", err.message);
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        res.json(result.rows);
    });
});


router.post('/log/administrador/resultadosCompetidor/agregar', async (req, res) => {
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
                INSERT INTO llaves_competidor_resultado 
                    (id_evento_fk, nivel, nombre_categoria, peso_categoria, genero, nombres_competidor, apellidos_competidor, nombre_delegacion, resultado, puntaje, ubicacion, cedula_competidor)
                VALUES 
                    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (id_evento_fk, nivel, nombre_categoria, peso_categoria, genero, nombres_competidor, apellidos_competidor, nombre_delegacion, cedula_competidor)
                DO UPDATE SET 
                    resultado = EXCLUDED.resultado,
                    puntaje = EXCLUDED.puntaje,
                    ubicacion = EXCLUDED.ubicacion
            `;
            const insertValues = [
                c.id_evento_fk, 
                c.nivel, 
                c.nombre_categoria, 
                c.peso_categoria, 
                c.genero, 
                c.nombres_competidor, 
                c.apellidos_competidor, 
                c.nombre_delegacion, 
                c.resultado, 
                c.puntaje, 
                c.ubicacion,
                c.cedula_competidor
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
            // 3. Insertar o actualizar en historial_resultado_combate
            const historialSql = `
                INSERT INTO historial_resultado_combate 
                    (titulo_evento, nivel, nombre_categoria, peso_categoria, genero, nombres_competidor, apellidos_competidor, nombre_delegacion, resultado, ubicacion, cedula_competidor, id_evento, modalidad_evento, deporte_evento)
                VALUES 
                    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                ON CONFLICT (titulo_evento, nivel, nombre_categoria, peso_categoria, genero, nombres_competidor, apellidos_competidor, nombre_delegacion, cedula_competidor, id_evento, modalidad_evento, deporte_evento)
                DO UPDATE SET 
                    resultado = EXCLUDED.resultado,
                    ubicacion = EXCLUDED.ubicacion
            `;

            const historialValues = [
                titulo_evento,
                c.nivel,
                c.nombre_categoria,
                c.peso_categoria,
                c.genero,
                c.nombres_competidor,
                c.apellidos_competidor,
                c.nombre_delegacion,
                c.resultado,
                c.ubicacion,
                c.cedula_competidor,
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
});


// Obtener las categorias
router.get('/log/administrador/resultados/obtenerCategorias/:id_evento/:nivel/:genero', (req, res) => {
    const {id_evento, nivel, genero} = req.params;
    const sql = `SELECT DISTINCT nombre_categoria FROM llaves_competidor_resultado
                 WHERE id_evento_fk = $1 AND nivel = $2 AND genero = $3`;
    db.query(sql, [id_evento, nivel, genero], (err, result) => {
        if (err) {
            console.error("Error al obtener las categorías: ", err.message);
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        // Siempre devuelve un array, aunque esté vacío
        res.json(result.rows);
    })
})

// Mostrar lista en administradores
router.get('/log/administrador/resultados/listar/:id_evento_fk/:nivel/:genero/:nombre_categoria', (req, res) => {
    const { id_evento_fk, nivel, genero, nombre_categoria } = req.params;
    // Para el orden de peso_categoria, PostgreSQL no soporta `FIELD` como MySQL, entonces usamos `CASE`
    const sql = `
        SELECT * FROM llaves_competidor_resultado
        WHERE id_evento_fk = $1 AND nivel = $2 AND genero = $3 AND nombre_categoria = $4 AND ubicacion != 'NADA'
        ORDER BY
            puntaje DESC,
            CASE 
                WHEN ubicacion = 'PRIMER LUGAR' THEN 1
                WHEN ubicacion = 'SEGUNDO LUGAR' THEN 2
                WHEN ubicacion = 'TERCER LUGAR' THEN 3
                WHEN ubicacion = 'CUARTO LUGAR' THEN 4
                ELSE 5
            END ASC`;
    db.query(sql, [id_evento_fk, nivel, genero, nombre_categoria], (err, result) => {
        if (err) {
            console.error("Error al obtener los resultados: ", err.message);
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        // Siempre devuelve un array, aunque esté vacío
        res.json(result.rows);
    });
});


// Eliminar de lista de resultados
router.delete('/log/administrador/resultados/lista/eliminar/:id', (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM llaves_competidor_resultado WHERE idllaves_competidor_resultado = $1`;
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: "Error al eliminar el resultado" });
        }
        res.json('Se eliminó correctamente el resultado');
    });
});


module.exports = router;