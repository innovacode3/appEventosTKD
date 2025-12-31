const express = require('express');
const dbConnect = require('../db/connect');

const router = express.Router();
const db = dbConnect();

//Obtener alumnos poomsae inscritos
router.get('/log/delegacion/evento/poomsae/poomsae_inscripcion/:id_evento_fk/:id_delegacion_fk', (req, res) => {
    const { id_evento_fk, id_delegacion_fk } = req.params;
    const sql = `SELECT * FROM suscrito_alumno_poomsae 
                 WHERE id_evento_fk = $1 AND id_delegacion_fk = $2
                 ORDER BY
                    CASE
                        WHEN categoria_suscrito_alumno_poomsae = 'PRE INFANTIL' THEN 1
                        WHEN categoria_suscrito_alumno_poomsae = 'PRE CADETES A' THEN 2
                        WHEN categoria_suscrito_alumno_poomsae = 'PRE CADETES B' THEN 3
                        WHEN categoria_suscrito_alumno_poomsae = 'PRE CADETES C' THEN 4
                        WHEN categoria_suscrito_alumno_poomsae = 'CADETES' THEN 5
                        WHEN categoria_suscrito_alumno_poomsae = 'PREJUVENIL' THEN 6
                        WHEN categoria_suscrito_alumno_poomsae = 'JUVENIL U22' THEN 7
                        WHEN categoria_suscrito_alumno_poomsae = 'SENIOR' THEN 8
                        ELSE 9
                    END,
                    CASE
                        WHEN genero_suscrito_alumno_poomsae = 'Masculino' THEN 1
                        WHEN genero_suscrito_alumno_poomsae = 'Femenino' THEN 2
                        ELSE 3
                    END,
                    CASE
                        WHEN cinturon_suscrito_alumno_poomsae = 'Blanco' THEN 1
                        WHEN cinturon_suscrito_alumno_poomsae = 'Blanco-Amarillo' THEN 2
                        WHEN cinturon_suscrito_alumno_poomsae = 'Amarillo' THEN 3
                        WHEN cinturon_suscrito_alumno_poomsae = 'Amarillo-Verde' THEN 4
                        WHEN cinturon_suscrito_alumno_poomsae = 'Verde' THEN 5
                        WHEN cinturon_suscrito_alumno_poomsae = 'Verde-Azul' THEN 6
                        WHEN cinturon_suscrito_alumno_poomsae = 'Azul' THEN 7
                        WHEN cinturon_suscrito_alumno_poomsae = 'Azul-Rojo' THEN 8
                        WHEN cinturon_suscrito_alumno_poomsae = 'Rojo' THEN 9
                        WHEN cinturon_suscrito_alumno_poomsae = 'Rojo-Negro' THEN 10
                        WHEN cinturon_suscrito_alumno_poomsae = 'Negro' THEN 10
                    END`;
    db.query(sql, [id_evento_fk, id_delegacion_fk], (err, result) => {
        if (err) {
            console.error("Error al obtener alumnos inscritos: ", err.message);
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        if (result.rows.length > 0) {
            res.json(result.rows);
        } else {
            res.status(404).json({ mensaje: "No hay registros" });
        }
    });
});

// Verificar si el alumno ya está inscrito por cédula
router.get('/log/delegacion/evento/poomsae/poomsae_Inscripcion/cedula/:id_evento_fk/:cedula', (req, res) => {
    const { id_evento_fk, cedula } = req.params;
    const sql = `SELECT cedula_suscrito_alumno_poomsae FROM suscrito_alumno_poomsae WHERE id_evento_fk = $1 AND cedula_suscrito_alumno_poomsae = $2`;
    db.query(sql, [id_evento_fk, cedula], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Error al obtener los datos" });
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

//Agregar alumno inscrito poomsae
router.post('/log/delegacion/evento/poomsae/poomsae_Inscripcion/agregar', (req, res) => {
    const {
        cedula_suscrito_alumno_poomsae,
        id_evento_fk,
        id_delegacion_fk,
        nombres_suscrito_alumno_poomsae,
        apellidos_suscrito_alumno_poomsae,
        edad_suscrito_alumno_poomsae,
        categoria_suscrito_alumno_poomsae,
        genero_suscrito_alumno_poomsae,
        cinturon_suscrito_alumno_poomsae
    } = req.body;
    const sql = `
        INSERT INTO suscrito_alumno_poomsae (
            cedula_suscrito_alumno_poomsae,
            id_evento_fk,
            id_delegacion_fk,
            nombres_suscrito_alumno_poomsae,
            apellidos_suscrito_alumno_poomsae,
            edad_suscrito_alumno_poomsae,
            categoria_suscrito_alumno_poomsae,
            genero_suscrito_alumno_poomsae,
            cinturon_suscrito_alumno_poomsae
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
    const values = [
        cedula_suscrito_alumno_poomsae,
        id_evento_fk,
        id_delegacion_fk,
        nombres_suscrito_alumno_poomsae,
        apellidos_suscrito_alumno_poomsae,
        edad_suscrito_alumno_poomsae,
        categoria_suscrito_alumno_poomsae,
        genero_suscrito_alumno_poomsae,
        cinturon_suscrito_alumno_poomsae
    ];
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error al insertar el alumno:", err.message);
            return res.status(500).json({ error: "Error al insertar el alumno" });
        }
        res.json('Se insertó correctamente el usuario');
    });
});


//Editar alumno inscrito poomsae
router.put('/log/delegacion/evento/poomsae/poomsae_Inscripcion/actualizar/:id', (req, res) => {
    const { id } = req.params;
    const {
        cedula_suscrito_alumno_poomsae,
        id_evento_fk,
        id_delegacion_fk,
        nombres_suscrito_alumno_poomsae,
        apellidos_suscrito_alumno_poomsae,
        edad_suscrito_alumno_poomsae,
        categoria_suscrito_alumno_poomsae,
        genero_suscrito_alumno_poomsae,
        cinturon_suscrito_alumno_poomsae
    } = req.body;
    const sql = `
        UPDATE suscrito_alumno_poomsae
        SET
            cedula_suscrito_alumno_poomsae = $1,
            id_evento_fk = $2,
            id_delegacion_fk = $3,
            nombres_suscrito_alumno_poomsae = $4,
            apellidos_suscrito_alumno_poomsae = $5,
            edad_suscrito_alumno_poomsae = $6,
            categoria_suscrito_alumno_poomsae = $7,
            genero_suscrito_alumno_poomsae = $8,
            cinturon_suscrito_alumno_poomsae = $9
        WHERE id_suscrito_alumno_poomsae = $10`;
    const values = [
        cedula_suscrito_alumno_poomsae,
        id_evento_fk,
        id_delegacion_fk,
        nombres_suscrito_alumno_poomsae,
        apellidos_suscrito_alumno_poomsae,
        edad_suscrito_alumno_poomsae,
        categoria_suscrito_alumno_poomsae,
        genero_suscrito_alumno_poomsae,
        cinturon_suscrito_alumno_poomsae,
        id
    ];
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error al actualizar el alumno:", err.message);
            return res.status(500).json({ error: "Error al actualizar el alumno" });
        }
        res.json('Se actualizó correctamente el alumno inscrito');
    });
});

//Eliminar alumno inscrito poomsae
router.delete('/log/delegacion/evento/poomsae/poomsae_Inscripcion/eliminar/:id', (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM suscrito_alumno_poomsae WHERE id_suscrito_alumno_poomsae = $1`;
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error al eliminar el alumno:", err.message);
            return res.status(500).json({ error: "Error al eliminar el alumno" });
        }
        res.json('Se eliminó correctamente el alumno inscrito');
    });
});

//Obtener el total de los competidores inscritos en poomsae
router.get('/evento/poomsae/obtenerTotalCompetidores/:id_evento/:categoria/:cinturon', (req, res) => {
    const { id_evento, categoria, cinturon } = req.params;
    const sql = `SELECT COUNT(*) AS total_competidores
                    FROM suscrito_alumno_poomsae
                    WHERE id_evento_fk = $1 AND categoria_suscrito_alumno_poomsae = $2 AND cinturon_suscrito_alumno_poomsae = $3`;
    db.query(sql, [id_evento, categoria, cinturon], (err, result) => {
        if (err) {
            console.error('Error al obtener el total de competidores:', err);
            return res.status(500).send('Error interno del servidor');
        }
        if(result.rows.length > 0) {
            res.json(result.rows[0].total_competidores);
        } else {
            res.status(404).json({ mensaje: "No se puede contabilizar" });
        }
    });
});

//Obtener categoria y cinturón para los filtros
router.get('/evento/poomsae/obtenerCategoriaCinturon/:id_evento_fk', (req, res) => {
    const { id_evento_fk } = req.params;
    const sql = `
                 SELECT 
                        categoria_suscrito_alumno_poomsae AS nombre_categoria, 
                        cinturon_suscrito_alumno_poomsae AS cinturones
                 FROM suscrito_alumno_poomsae
                 WHERE id_evento_fk = $1
                 GROUP BY categoria_suscrito_alumno_poomsae, cinturon_suscrito_alumno_poomsae
                 ORDER BY
                    CASE
                        WHEN categoria_suscrito_alumno_poomsae = 'PRE INFANTIL' THEN 1
                        WHEN categoria_suscrito_alumno_poomsae = 'PRE CADETES A' THEN 2
                        WHEN categoria_suscrito_alumno_poomsae = 'PRE CADETES B' THEN 3
                        WHEN categoria_suscrito_alumno_poomsae = 'PRE CADETES C' THEN 4
                        WHEN categoria_suscrito_alumno_poomsae = 'CADETES' THEN 5
                        WHEN categoria_suscrito_alumno_poomsae = 'PREJUVENIL' THEN 6
                        WHEN categoria_suscrito_alumno_poomsae = 'JUVENIL U22' THEN 7
                        WHEN categoria_suscrito_alumno_poomsae = 'SENIOR' THEN 8
                        ELSE 9
                    END,
                    CASE 
                        WHEN cinturon_suscrito_alumno_poomsae = 'Blanco' THEN 1
                        WHEN cinturon_suscrito_alumno_poomsae = 'Blanco-Amarillo' THEN 2
                        WHEN cinturon_suscrito_alumno_poomsae = 'Amarillo' THEN 3
                        WHEN cinturon_suscrito_alumno_poomsae = 'Amarillo-Verde' THEN 4
                        WHEN cinturon_suscrito_alumno_poomsae = 'Verde' THEN 5
                        WHEN cinturon_suscrito_alumno_poomsae = 'Verde-Azul' THEN 6
                        WHEN cinturon_suscrito_alumno_poomsae = 'Azul' THEN 7
                        WHEN cinturon_suscrito_alumno_poomsae = 'Azul-Rojo' THEN 8
                        WHEN cinturon_suscrito_alumno_poomsae = 'Rojo' THEN 9
                        WHEN cinturon_suscrito_alumno_poomsae = 'Rojo-Negro' THEN 10
                        WHEN cinturon_suscrito_alumno_poomsae = 'Negro' THEN 11 
                        ELSE 12
                    END
                `;
    db.query(sql, [id_evento_fk], (err, result) => {
        if (err) {
            console.error("Error al obtener categoría y cinturones: ", err.message);
            return res.status(500).json({ error: "Error al obtener los datos" });
        }

        // Agrupar resultados por nivel
        const agrupado = {};
        result.rows.forEach(row => {
            const { nombre_categoria, cinturones } = row;
            if (!agrupado[nombre_categoria]) {
                agrupado[nombre_categoria] = [];
            }
            if (!agrupado[nombre_categoria].includes(cinturones)) {
                agrupado[nombre_categoria].push(cinturones);
            }
        });

        // Convertir a array de objetos
        const respuesta = Object.keys(agrupado).map(nombre_categoria => ({
            nombre_categoria,
            cinturones: agrupado[nombre_categoria]
        }));

        res.json(respuesta);
    })
})

//Obtener la lista que se presentará en la pantalla para para poder ver luego el nombre de los inscritos
router.get('/evento/poomsae/obtenerFiltradas/:id_evento/:categoria/:cinturon', (req, res) => {
    const {id_evento, categoria, cinturon} = req.params;
    const sql = `SELECT 
                    categoria_suscrito_alumno_poomsae, 
                    genero_suscrito_alumno_poomsae, 
                    cinturon_suscrito_alumno_poomsae,
                    COUNT(*) AS total_alumnos
                FROM suscrito_alumno_poomsae
                WHERE id_evento_fk = $1 AND categoria_suscrito_alumno_poomsae = $2 AND cinturon_suscrito_alumno_poomsae = $3
                GROUP BY
                    categoria_suscrito_alumno_poomsae, 
                    genero_suscrito_alumno_poomsae, 
                    cinturon_suscrito_alumno_poomsae 
                ORDER BY
                    CASE
                        WHEN categoria_suscrito_alumno_poomsae = 'PRE INFANTIL' THEN 1
                        WHEN categoria_suscrito_alumno_poomsae = 'PRE CADETES A' THEN 2
                        WHEN categoria_suscrito_alumno_poomsae = 'PRE CADETES B' THEN 3
                        WHEN categoria_suscrito_alumno_poomsae = 'PRE CADETES C' THEN 4
                        WHEN categoria_suscrito_alumno_poomsae = 'CADETES' THEN 5
                        WHEN categoria_suscrito_alumno_poomsae = 'PREJUVENIL' THEN 6
                        WHEN categoria_suscrito_alumno_poomsae = 'JUVENIL U22' THEN 7
                        WHEN categoria_suscrito_alumno_poomsae = 'SENIOR' THEN 8
                        ELSE 9
                    END,
                    CASE
                        WHEN genero_suscrito_alumno_poomsae = 'Masculino' THEN 1
                        WHEN genero_suscrito_alumno_poomsae = 'Femenino' THEN 2
                        ELSE 3
                    END,
                    CASE
                        WHEN cinturon_suscrito_alumno_poomsae = 'Blanco' THEN 1
                        WHEN cinturon_suscrito_alumno_poomsae = 'Blanco-Amarillo' THEN 2
                        WHEN cinturon_suscrito_alumno_poomsae = 'Amarillo' THEN 3
                        WHEN cinturon_suscrito_alumno_poomsae = 'Amarillo-Verde' THEN 4
                        WHEN cinturon_suscrito_alumno_poomsae = 'Verde' THEN 5
                        WHEN cinturon_suscrito_alumno_poomsae = 'Verde-Azul' THEN 6
                        WHEN cinturon_suscrito_alumno_poomsae = 'Azul' THEN 7
                        WHEN cinturon_suscrito_alumno_poomsae = 'Azul-Rojo' THEN 8
                        WHEN cinturon_suscrito_alumno_poomsae = 'Rojo' THEN 9
                        WHEN cinturon_suscrito_alumno_poomsae = 'Rojo-Negro' THEN 10
                        WHEN cinturon_suscrito_alumno_poomsae = 'Negro' THEN 11
                        ELSE 12
                    END`;
    db.query(sql, [id_evento, categoria, cinturon], (err, result) => {
        if (err) {
            console.error("Error al obtener el listado: ", err.message);
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
      
        if (result.rows.length > 0) {
            res.json(result.rows);
        } else {
            res.status(404).json({ mensaje: "No hay registros" });
        }
    });
});

//Obtener la lista de competidores con los filtros anteriores
router.get('/evento/poomsae/listarCompetidores/:id_evento/:categoria/:cinturon/:genero', (req, res) => {
    const {id_evento, categoria, cinturon, genero} = req.params;
    const sql = `SELECT r.cedula_suscrito_alumno_poomsae, 
                        r.nombres_suscrito_alumno_poomsae, 
                        r.apellidos_suscrito_alumno_poomsae, 
                        d.nombre_delegacion
                 FROM suscrito_alumno_poomsae r
                 JOIN registro_delegacion d ON r.id_delegacion_fk = d.id_delegacion
                 WHERE r.id_evento_fk = $1 
                   AND r.categoria_suscrito_alumno_poomsae = $2 
                   AND r.cinturon_suscrito_alumno_poomsae = $3 
                   AND r.genero_suscrito_alumno_poomsae = $4`;
    db.query(sql, [id_evento, categoria, cinturon, genero], (err, result) => {
        if (err) {
            console.error('Error al obtener los competidores:', err);
            return res.status(500).send('Error interno del servidor');
        } 
        // En caso de no tener competidores devuelve un array vacío
        res.json(result.rows.length > 0 ? result.rows : []);
    });
});

//Endpoint para obtener las listas de los inscritos en el modo administrador
//Listar las categorias
router.get('/log/administrador/evento/listaPoomsae/:id_evento_fk', (req, res) => {
  const { id_evento_fk } = req.params;

  const sql = `
    SELECT 
      categoria_suscrito_alumno_poomsae,
      genero_suscrito_alumno_poomsae,
      cinturon_suscrito_alumno_poomsae,
      COUNT(*) AS total_alumnos
    FROM suscrito_alumno_poomsae
    WHERE id_evento_fk = $1
    GROUP BY categoria_suscrito_alumno_poomsae, genero_suscrito_alumno_poomsae, cinturon_suscrito_alumno_poomsae
    ORDER BY 
      CASE
        WHEN categoria_suscrito_alumno_poomsae = 'PRE INFANTIL' THEN 1
        WHEN categoria_suscrito_alumno_poomsae = 'PRE CADETES A' THEN 2
        WHEN categoria_suscrito_alumno_poomsae = 'PRE CADETES B' THEN 3
        WHEN categoria_suscrito_alumno_poomsae = 'PRE CADETES C' THEN 4
        WHEN categoria_suscrito_alumno_poomsae = 'CADETES' THEN 5
        WHEN categoria_suscrito_alumno_poomsae = 'PREJUVENIL' THEN 6
        WHEN categoria_suscrito_alumno_poomsae = 'JUVENIL U22' THEN 7
        WHEN categoria_suscrito_alumno_poomsae = 'SENIOR' THEN 8
        ELSE 9
      END,
      CASE
        WHEN genero_suscrito_alumno_poomsae = 'Masculino' THEN 1
        WHEN genero_suscrito_alumno_poomsae = 'Femenino' THEN 2
        ELSE 3
      END,
      CASE
        WHEN cinturon_suscrito_alumno_poomsae = 'Blanco' THEN 1
        WHEN cinturon_suscrito_alumno_poomsae = 'Blanco-Amarillo' THEN 2
        WHEN cinturon_suscrito_alumno_poomsae = 'Amarillo' THEN 3
        WHEN cinturon_suscrito_alumno_poomsae = 'Amarillo-Verde' THEN 4
        WHEN cinturon_suscrito_alumno_poomsae = 'Verde' THEN 5
        WHEN cinturon_suscrito_alumno_poomsae = 'Verde-Azul' THEN 6
        WHEN cinturon_suscrito_alumno_poomsae = 'Azul' THEN 7
        WHEN cinturon_suscrito_alumno_poomsae = 'Azul-Rojo' THEN 8
        WHEN cinturon_suscrito_alumno_poomsae = 'Rojo' THEN 9
        WHEN cinturon_suscrito_alumno_poomsae = 'Rojo-Negro' THEN 10
        WHEN cinturon_suscrito_alumno_poomsae = 'Negro' THEN 10
      END;
  `;

  // Aquí usamos db.query con el pool
  db.query(sql, [id_evento_fk], (err, result) => {
    if (err) {
      console.error("Error al obtener los resultados: ", err.message);
      return res.status(500).json({ error: "Error al obtener los datos" });
    }

    // Responder con los resultados de la consulta
    res.json(result.rows);
  });
});

//Listar los alumnos que están en esas categorias
router.get('/log/administrador/evento/listaAlumnosPoomsae/:id_evento/:categoria/:cinturon/:genero', (req, res) => {
    const {id_evento, categoria, cinturon, genero} = req.params;
    const sql = `SELECT r.nombres_suscrito_alumno_poomsae, 
                        r.apellidos_suscrito_alumno_poomsae,
                        r.categoria_suscrito_alumno_poomsae,
                        r.cinturon_suscrito_alumno_poomsae,
                        r.genero_suscrito_alumno_poomsae, 
                        d.nombre_delegacion,
                        COUNT(*) AS total_alumnos
                 FROM suscrito_alumno_poomsae r
                 JOIN registro_delegacion d ON r.id_delegacion_fk = d.id_delegacion
                 WHERE r.id_evento_fk = $1 
                   AND r.categoria_suscrito_alumno_poomsae = $2 
                   AND r.cinturon_suscrito_alumno_poomsae = $3 
                   AND r.genero_suscrito_alumno_poomsae = $4
                 GROUP BY 
                    r.nombres_suscrito_alumno_poomsae, 
                    r.apellidos_suscrito_alumno_poomsae,
                    r.categoria_suscrito_alumno_poomsae,
                    r.cinturon_suscrito_alumno_poomsae,
                    r.genero_suscrito_alumno_poomsae,
                    d.nombre_delegacion;`;
    db.query(sql, [id_evento, categoria, cinturon, genero], (err, result) => {
        if (err) {
            console.error('Error al obtener los competidores:', err);
            return res.status(500).send('Error interno del servidor');
        } 
        // En caso de no tener competidores devuelve un array vacío
        res.json(result.rows.length > 0 ? result.rows : []);
    });
});

module.exports = router;