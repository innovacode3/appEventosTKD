const express = require('express');
const dbConnect = require("../db/connect");

const router = express.Router()
const db = dbConnect();

//Obtener todos los datos de historial combate por id
router.get('/historialCombate/:id', (req, res) => {
    const {id} = req.params;
    const sql = `SELECT * FROM historial_resultado_combate
                 WHERE id_evento = $1`;
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error al obtener los resultados: ", err.message)
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        //Mostramos el array aunque esté vacío
        res.json(result.rows);
    })
})

//Obtener todos los datos de historial poomsae por id
router.get('/historialPoomsae/:id', (req, res) => {
    const {id} = req.params;
    const sql = `SELECT * FROM historial_resultado_poomsae
                 WHERE id_evento = $1`;
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error al obtener los resultados: ", err.message)
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        //Mostramos el array aunque esté vacío
        res.json(result.rows);
    })
})

//Obtener la lista del historial de combate
router.get('/historialCompetencia/combate/:titulo_evento/:nivel/:nombre_categoria/:peso_categoria/:genero', (req, res) => {
    const {titulo_evento, nivel, nombre_categoria, peso_categoria, genero} = req.params;
    const sql = `SELECT *,
                    CASE 
                        WHEN ubicacion = 'PRIMER LUGAR' THEN 'PRIMER LUGAR 🥇'
                        WHEN ubicacion = 'SEGUNDO LUGAR' THEN 'SEGUNDO LUGAR 🥈'
                        WHEN ubicacion = 'TERCER LUGAR' THEN 'TERCER LUGAR 🥉'
                        WHEN ubicacion = 'CUARTO LUGAR' THEN 'CUARTO LUGAR 🏅'
                        ELSE ubicacion
                    END AS ubicacion
                FROM historial_resultado_combate
                WHERE titulo_evento = $1 AND nivel = $2 AND nombre_categoria = $3 AND peso_categoria = $4 AND genero = $5
                      AND ubicacion != 'NADA'
                ORDER BY
                    CASE 
                        WHEN ubicacion = 'PRIMER LUGAR' THEN 1
                        WHEN ubicacion = 'SEGUNDO LUGAR' THEN 2
                        WHEN ubicacion = 'TERCER LUGAR' THEN 3
                        WHEN ubicacion = 'CUARTO LUGAR' THEN 4
                        ELSE 5
                    END`;
    db.query(sql, [titulo_evento, nivel, nombre_categoria, peso_categoria, genero], (err, result) => {
        if (err) {
            console.error("Error al obtener los resultados: ", err.message)
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        //Mostramos el array aunque esté vacío
        res.json(result.rows);
    })
})

//Obtener la lista modo admistrador (nivel-categoria-peso-genero-competidores)
router.get('/historialCompetencia/administrador/combate/:titulo_evento', (req, res) => {
    const {titulo_evento} = req.params;
    const sql = `SELECT 
                    nivel, 
                    nombre_categoria, 
                    peso_categoria, 
                    genero, 
                    COUNT(*) AS total_alumnos
                 FROM historial_resultado_combate
                 WHERE titulo_evento = $1
                 GROUP BY nivel, nombre_categoria, peso_categoria, genero`;
    db.query(sql, [titulo_evento], (err, result) => {
        if (err) {
            console.error("Error al obtener los resultados: ", err.message)
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        //Retornamos un array aunque sea vacío
        res.json(result.rows);
    })
})

//Obtener la lista modo administrador (categoria-cinturón-género-competidores)
router.get('/historialCompetencia/administrador/poomsae/:titulo_evento', (req, res) => {
    const {titulo_evento} = req.params;
    const sql = `SELECT 
                    poomsae_categoria, 
                    poomsae_cinturon, 
                    poomsae_genero, 
                    COUNT(*) AS total_alumnos
                 FROM historial_resultado_poomsae
                 WHERE titulo_evento = $1
                 GROUP BY poomsae_categoria, poomsae_cinturon, poomsae_genero
                 ORDER BY
                    CASE
                        WHEN poomsae_categoria = 'PRE INFANTIL' THEN 1
                        WHEN poomsae_categoria = 'PRE CADETES A' THEN 2
                        WHEN poomsae_categoria = 'PRE CADETES B' THEN 3
                        WHEN poomsae_categoria = 'PRE CADETES C' THEN 4
                        WHEN poomsae_categoria = 'CADETES' THEN 5
                        WHEN poomsae_categoria = 'PREJUVENIL' THEN 6
                        WHEN poomsae_categoria = 'JUVENIL U22' THEN 7
                        WHEN poomsae_categoria = 'SENIOR' THEN 8
                        ELSE 9
                    END,
                    CASE
                        WHEN poomsae_cinturon = 'Blanco' THEN 1
                        WHEN poomsae_cinturon = 'Blanco-Amarillo' THEN 2
                        WHEN poomsae_cinturon = 'Amarillo' THEN 3
                        WHEN poomsae_cinturon = 'Amarillo-Verde' THEN 4
                        WHEN poomsae_cinturon = 'Verde' THEN 5
                        WHEN poomsae_cinturon = 'Verde-Azul' THEN 6
                        WHEN poomsae_cinturon = 'Azul' THEN 7
                        WHEN poomsae_cinturon = 'Azul-Rojo' THEN 8
                        WHEN poomsae_cinturon = 'Rojo' THEN 9
                        WHEN poomsae_cinturon = 'Rojo-Negro' THEN 10
                        WHEN poomsae_cinturon = 'Negro' THEN 11
                        ELSE 12
                    END,
                    CASE
                        WHEN poomsae_genero = 'Masculino' THEN 1
                        WHEN poomsae_genero = 'Femenino' THEN 2
                        ELSE 3
                    END`;
    db.query(sql, [titulo_evento], (err, result) => {
        if (err) {
            console.error("Error al obtener los resultados: ", err.message)
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        //Retornamos un array aunque sea vacío
        res.json(result.rows);
    })
})

//eliminar modo admin por registro combate
router.delete('/historialCompetencia/combate/eliminar/:titulo_evento/:nivel/:nombre_categoria/:peso_categoria/:genero', (req, res) => {
    const {titulo_evento, nivel, nombre_categoria, peso_categoria, genero} = req.params;
    const sql = `DELETE FROM historial_resultado_combate
                 WHERE titulo_evento = $1 AND nivel = $2 AND nombre_categoria = $3 AND peso_categoria = $4 AND genero = $5`;
    db.query(sql, [titulo_evento, nivel, nombre_categoria, peso_categoria, genero], (err, result) => {
        if (err) {
            console.error("Error al eliminar el registro:", err.message);
            return res.status(500).json({ error: "Error al eliminar el historial" });
        }
        res.json('Se eliminó correctamente el historial');
    })
})

//eliminar modo admin todo el registro por titulo_evento combate
router.delete('/historialCompetencia/combate/eliminarTodos/:titulo_evento', (req, res) => {
    const {titulo_evento} = req.params;
    const sql = `DELETE FROM historial_resultado_combate
                 WHERE titulo_evento = $1`;
    db.query(sql, [titulo_evento], (err, result) => {
        if (err) {
            console.error("Error al eliminar el registro:", err.message);
            return res.status(500).json({ error: "Error al eliminar el historial" });
        }
        res.json('Se eliminó correctamente el historial');
    })
})

//eliminar modo admin por registro poomsae
router.delete('/historialCompetencia/poomsae/eliminar/:titulo_evento/:genero/:categoria/:cinturon', (req, res) => {
    const {titulo_evento, genero, categoria, cinturon} = req.params;
    const sql = `DELETE FROM historial_resultado_poomsae
                 WHERE titulo_evento = $1 AND poomsae_genero = $2 AND poomsae_categoria = $3 AND poomsae_cinturon = $4`;
    db.query(sql, [titulo_evento, genero, categoria, cinturon], (err, result) => {
        if (err) {
            console.error("Error al eliminar el registro:", err.message);
            return res.status(500).json({ error: "Error al eliminar el historial" });
        }
        res.json('Se eliminó correctamente el historial');
    })
})

//eliminar modo admin todo el registro por titulo_evento poomsae
router.delete('/historialCompetencia/poomsae/eliminarTodos/:titulo_evento', (req, res) => {
    const {titulo_evento} = req.params;
    const sql = `DELETE FROM historial_resultado_poomsae
                 WHERE titulo_evento = $1`;
    db.query(sql, [titulo_evento], (err, result) => {
        if (err) {
            console.error("Error al eliminar el registro:", err.message);
            return res.status(500).json({ error: "Error al eliminar el historial" });
        }
        res.json('Se eliminó correctamente el historial');
    })
})

//Obtener la lista de las categorias
router.get('/historialCompetencia/categorias/:id_evento/:nivel/:genero', (req, res) => {
    const {id_evento, nivel, genero} = req.params;
    const sql = `SELECT DISTINCT nombre_categoria FROM historial_resultado_combate
                 WHERE id_evento = $1 AND nivel = $2 AND genero = $3`;
    db.query(sql, [id_evento, nivel, genero], (err, result) => {
        if (err) {
            console.error("Error al obtener los resultados: ", err.message)
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        //Siempre muestra un array aunque sea vacío
        res.json(result.rows)
    })
})

//Obtener la lista de categorias en poomsae
router.get('/historialCompetencia/categorias/poomsae/:id_evento', (req, res) => {
    const {id_evento} = req.params;
    const sql = `SELECT poomsae_categoria FROM historial_resultado_poomsae
                 WHERE id_evento = $1
                 GROUP BY poomsae_categoria
                 ORDER BY
                    CASE
                        WHEN poomsae_categoria = 'PRE INFANTIL' THEN 1
                        WHEN poomsae_categoria = 'PRE CADETES A' THEN 2
                        WHEN poomsae_categoria = 'PRE CADETES B' THEN 3
                        WHEN poomsae_categoria = 'PRE CADETES C' THEN 4
                        WHEN poomsae_categoria = 'CADETES' THEN 5
                        WHEN poomsae_categoria = 'PREJUVENIL' THEN 6
                        WHEN poomsae_categoria = 'JUVENIL U22' THEN 7
                        WHEN poomsae_categoria = 'SENIOR' THEN 8
                        ELSE 9
                    END`;
    db.query(sql, [id_evento], (err, result) => {
        if (err) {
            console.error("Error al obtener los resultados: ", err.message)
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        //Siempre muestra un array aunque sea vacío
        res.json(result.rows)
    })
})

//Obtener la lista de los pesos de las categorias
router.get('/historialCompetencia/pesos_categorias/:id_evento/:nivel/:genero/:nombre_categoria', (req, res) => {
    const {id_evento, nivel, genero, nombre_categoria} = req.params;
    const sql = `SELECT  DISTINCT peso_categoria FROM historial_resultado_combate
                 WHERE id_evento = $1 AND nivel = $2 AND genero = $3 AND nombre_categoria = $4`;
    db.query(sql, [id_evento, nivel, genero, nombre_categoria], (err, result) => {
        if (err) {
            console.error("Error al obtener los resultados: ", err.message)
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        //Siempre muestra un array aunque sea vacío
        res.json(result.rows)
    })
})

//Obtener la lista del historial de poomsae
router.get('/historialCompetencia/poomsae/:titulo_evento/:genero/:categoria/:cinturon', (req, res) => {
    const { titulo_evento, genero, categoria, cinturon } = req.params;
    const sql = `SELECT * FROM historial_resultado_poomsae
                 WHERE titulo_evento = $1 AND poomsae_genero = $2 AND poomsae_categoria = $3 AND poomsae_cinturon = $4
                 ORDER BY
                    CASE
                        WHEN ubicacion = 'PRIMER LUGAR' THEN 1
                        WHEN ubicacion = 'SEGUNDO LUGAR' THEN 2
                        WHEN ubicacion = 'TERCER LUGAR' THEN 3
                        WHEN ubicacion = 'CUARTO LUGAR' THEN 4
                        WHEN ubicacion = 'NADA' THEN 6
                        ELSE 6
                    END`;
    db.query(sql, [titulo_evento, genero, categoria, cinturon], (err, result) => {
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

//Obtener la lista de los cinturones
router.get('/historialCompetencia/cinturones/:id_evento/:genero/:categoria', (req, res) => {
  const { id_evento, genero, categoria } = req.params;

  const sql = `
    SELECT poomsae_cinturon FROM (
      SELECT DISTINCT poomsae_cinturon
      FROM historial_resultado_poomsae
      WHERE id_evento = $1 AND poomsae_genero = $2 AND poomsae_categoria = $3
    ) AS sub
    ORDER BY 
      CASE
        WHEN poomsae_cinturon = 'Blanco' THEN 1
        WHEN poomsae_cinturon = 'Blanco-Amarillo' THEN 2
        WHEN poomsae_cinturon = 'Amarillo' THEN 3
        WHEN poomsae_cinturon = 'Amarillo-Verde' THEN 4
        WHEN poomsae_cinturon = 'Verde' THEN 5
        WHEN poomsae_cinturon = 'Verde-Azul' THEN 6
        WHEN poomsae_cinturon = 'Azul' THEN 7
        WHEN poomsae_cinturon = 'Azul-Rojo' THEN 8
        WHEN poomsae_cinturon = 'Rojo' THEN 9
        WHEN poomsae_cinturon = 'Rojo-Negro' THEN 10
        WHEN poomsae_cinturon = 'Negro' THEN 11
        ELSE 12
      END
  `;

  db.query(sql, [id_evento, genero, categoria], (err, result) => {
    if (err) {
      console.error("Error al obtener los resultados:", err.message);
      return res.status(500).json({ error: "Error al obtener los datos" });
    }

    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ mensaje: "No hay registros" });
    }
  });
});


//Obtener los titulos de las competencias para combate
router.get('/historialCompetencia/obtenerTitulo', (req, res) => {
    const sql = `SELECT DISTINCT titulo_evento, id_evento FROM historial_resultado_combate 
                 WHERE modalidad_evento = 'Combate' OR modalidad_evento = 'Combate y Poomsae'`;
    db.query(sql, (err, result) => {
        if (err) {
            console.error("Error al obtener los resultados: ", err.message)
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        //Mostramos un array así sea vacío
        res.json(result.rows);
    })
})

//Obtener los titulos de las competencias para poomsae
router.get('/historialCompetencia/obtenerTitulo/poomsae', (req, res) => {
    const sql = `SELECT DISTINCT titulo_evento, id_evento FROM historial_resultado_poomsae 
                 WHERE modalidad_evento = 'Poomsae' OR modalidad_evento = 'Combate y Poomsae'`;
    db.query(sql, (err, result) => {
        if (err) {
            console.error("Error al obtener los resultados: ", err.message)
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        //Mostramos un array así sea vacío
        res.json(result.rows);
    })
})

module.exports = router;