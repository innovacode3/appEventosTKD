const express = require('express');
const dbConnect = require('../db/connect');
//variable router para utilizar la solicitud http (GET/POST/PUT/DELETE) en express
const router = express.Router();
//como dbConnect() es una funcion no la puedo aplicar directo, ejemplo: dbConnect().query(query, [correo_administrador], (error, results) => { es incorrecto,
//para eso almaceno en una variable llamada "conexion"
const db = dbConnect();

//listar todos los alumnos (modo logueado administrador)
router.get('/log/administrador/alumno/lista', (req, res) => {
    const query = 'SELECT * FROM registro_alumno';
    db.query(query, (error, resultado) => {
        if (error) {
            console.error(error.message);
            return res.status(500).json({ error: 'Error al obtener los datos' });
        }
        if (resultado.rows.length > 0) {
            res.json(resultado.rows);
        } else {
            res.json('No hay registros');
        }
    });
});

//obtener alumnos desde mod delegacion
router.get('/log/delegacion/alumno/:id', (req, res) => {
    const { id } = req.params;
    const query = `SELECT * FROM registro_alumno WHERE id_delegacion_fk = $1
                   ORDER BY
                        CASE
                            WHEN genero_alumno = 'Femenino' THEN 1
                            WHEN genero_alumno = 'Masculino' THEN 2
                            ELSE 3
                        END`; 
    db.query(query, [id], (error, resultado) => {
        if (error) {
            console.error('Error al obtener alumnos:', error.message);
            return res.status(500).json({ error: 'Error al obtener los datos' });
        }
        if (resultado.rows.length > 0) {
            res.json(resultado.rows);
        } else {
            res.status(404).json({ message: 'No se ha encontrado los registros' });
        }
    });
});

//obtener alumnos desde mod admin
router.get('/log/administrador/delegacion/alumnos/:id', (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT r.id_alumno, r.nombre_alumno, r.apellido_alumno, r.cedula_alumno, r.fecha_nacimiento_alumno, r.edad_alumno, r.genero_alumno,
               r.cinturon_alumno, d.nombre_delegacion
        FROM registro_alumno r
        JOIN registro_delegacion d ON r.id_delegacion_fk = d.id_delegacion
        WHERE r.id_delegacion_fk = $1
        ORDER BY
            CASE
                WHEN genero_alumno = 'Femenino' THEN 1
                WHEN genero_alumno = 'Masculino' THEN 2
                ELSE 3
            END`;   
    db.query(query, [id], (error, resultado) => {
        if (error) {
            console.error(error.message);
            return res.status(500).json({ error: 'Error al obtener los datos' });
        }
        if (resultado.rows.length > 0) {
            res.json(resultado.rows);
        } else {
            res.status(404).json({ message: 'No se ha encontrado el registro con ese ID en la base de datos' });
        }
    });
});

//log obtener alumno por id_alumno
router.get('/log/delegacion/un_alumno/:id', (req, res) => {
    const { id } = req.params;
    const query = `SELECT * FROM registro_alumno WHERE id_alumno = $1`;
    db.query(query, [id], (error, resultado) => {
        if (error) {
            console.error(error.message);
            return res.status(500).json({ error: 'Error al obtener los datos' });
        }
        if (resultado.rows.length > 0) {
            res.json(resultado.rows);
        } else {
            res.status(404).json({ message: 'No se ha encontrado el registro con ese ID en la base de datos' });
        }
    });
});

//agregar un alumno
router.post('/log/delegacion/alumno/agregar', (req, res) => {
    const { id_delegacion_fk, nombre_alumno, apellido_alumno, cedula_alumno, fecha_nacimiento_alumno, edad_alumno, genero_alumno, cinturon_alumno } = req.body;
    // Verificar si la cedula ya está registrada en la tabla de la BD
    const checkCedulaAlumnoQuery = 'SELECT COUNT(*) AS count FROM registro_alumno WHERE cedula_alumno = $1';
    db.query(checkCedulaAlumnoQuery, [cedula_alumno], (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        // Si la cedula ya está registrada, devolver un mensaje de error
        if (results.rows[0].count > 0) {
            return res.status(409).json({ message: 'Ya se encuentra registrado un alumno con esa cedula.' });
        }
        const query = `INSERT INTO registro_alumno (id_delegacion_fk, nombre_alumno, apellido_alumno, cedula_alumno, fecha_nacimiento_alumno, edad_alumno, genero_alumno, cinturon_alumno) 
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id_alumno`;
        db.query(query, [id_delegacion_fk, nombre_alumno, apellido_alumno, cedula_alumno, fecha_nacimiento_alumno, edad_alumno, genero_alumno, cinturon_alumno], (error, results) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            res.status(201).json({ message: 'Usuario creado exitosamente', id: results.rows[0].id_alumno });
        });
    });
});

//actualizar un alumno
router.put('/log/delegacion/alumno/editar/:id', (req, res) => {
    const { id } = req.params;
    const { id_delegacion_fk, nombre_alumno, apellido_alumno, cedula_alumno, fecha_nacimiento_alumno, edad_alumno, genero_alumno, cinturon_alumno } = req.body;
    // Primero, obtener la cédula actual del alumno desde la base de datos
    const getCedulaQuery = 'SELECT cedula_alumno FROM registro_alumno WHERE id_alumno = $1';
    db.query(getCedulaQuery, [id], (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        // Si no se encuentra el alumno, devolver un error
        if (results.rows.length === 0) {
            return res.status(404).json({ message: 'Alumno no encontrado' });
        }
        // Obtener la cédula actual del alumno
        const cedulaEncontrada = results.rows[0].cedula_alumno;
        // Verificar si la cédula ha cambiado
        if (cedula_alumno !== cedulaEncontrada) {
            // Si la cédula ha cambiado, verificar si ya existe en otro alumno
            const checkCedulaAlumnoQuery = 'SELECT COUNT(*) AS count FROM registro_alumno WHERE cedula_alumno = $1';
            db.query(checkCedulaAlumnoQuery, [cedula_alumno], (error, results) => {
                if (error) {
                    return res.status(500).json({ error: error.message });
                }
                // Si la cédula ya está registrada en otro alumno, devolver un error
                if (results.rows[0].count > 0) {
                    return res.status(409).json({ message: 'La cédula ya está registrada en otro alumno.' });
                }
                // Proceder con la actualización de los datos
                actualizarAlumno();
            });
        } else {
            // Si la cédula no ha cambiado, proceder directamente con la actualización
            actualizarAlumno();
        }
        // Función que realiza la actualización del alumno
        function actualizarAlumno() {
            const updateQuery = `
                UPDATE registro_alumno
                SET 
                    id_delegacion_fk = $1,
                    nombre_alumno = $2,
                    apellido_alumno = $3,
                    cedula_alumno = $4,
                    fecha_nacimiento_alumno = $5,
                    edad_alumno = $6,
                    genero_alumno = $7,
                    cinturon_alumno = $8
                WHERE id_alumno = $9
                RETURNING id_alumno`;
            db.query(updateQuery, [id_delegacion_fk, nombre_alumno, apellido_alumno, cedula_alumno, fecha_nacimiento_alumno, edad_alumno, genero_alumno, cinturon_alumno, id], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ message: 'Alumno actualizado correctamente', id_alumno: result.rows[0].id_alumno });
            });
        }
    });
});


//eliminar un alumno
router.delete('/log/delegacion/alumno/borrar/:cedula', async (req, res) => {
    const { cedula } = req.params;
  
    try {
      // Buscar fechas límite de eventos donde esté la cédula
      const queryFecha = 
      ` SELECT e.fecha_limite_inscripcion_evento
        FROM evento e
        INNER JOIN suscrito_alumno_evento sae ON sae.id_evento_fk = e.id_evento
        WHERE sae.cedula_suscrito_alumno_evento = $1
        UNION
        SELECT e.fecha_limite_inscripcion_evento
        FROM evento e
        INNER JOIN suscrito_alumno_poomsae sap ON sap.id_evento_fk = e.id_evento
        WHERE sap.cedula_suscrito_alumno_poomsae = $1`;
  
      const resultFechas = await db.query(queryFecha, [cedula]);
  
      const hoy = new Date();
  
      const hayEventosAbiertos = resultFechas.rows.some(row => {
        const fechaLimite = new Date(row.fecha_limite_inscripcion_evento);
        return hoy <= fechaLimite;
      });
  
      if (hayEventosAbiertos) {
        // Si hay eventos activos, eliminar también de tablas de suscripción
        const deleteSuscripcionesEvento = `
          DELETE FROM suscrito_alumno_evento 
          WHERE cedula_suscrito_alumno_evento = $1
        `;
        const deleteSuscripcionesPoomsae = `
          DELETE FROM suscrito_alumno_poomsae 
          WHERE cedula_suscrito_alumno_poomsae = $1
        `;
  
        await db.query(deleteSuscripcionesEvento, [cedula]);
        await db.query(deleteSuscripcionesPoomsae, [cedula]);
      }
  
      // Eliminar SIEMPRE de registro_alumno
      const deleteAlumno = `DELETE FROM registro_alumno WHERE cedula_alumno = $1`;
      await db.query(deleteAlumno, [cedula]);
  
      res.json({ message: 'Alumno eliminado correctamente' });
  
    } catch (error) {
      console.error('Error al eliminar alumno:', error.message);
      res.status(500).json({ error: 'Error al eliminar el alumno' });
    }
});

router.get('/prueba-cron', async (req, res) => {
  try {
    const query = `
      UPDATE registro_alumno
      SET edad_alumno = DATE_PART('year', AGE(CURRENT_DATE, TO_DATE(fecha_nacimiento_alumno, 'YYYY-MM-DD')));
    `;
    await db.query(query);
    res.send('Consulta SQL ejecutada con éxito desde backend');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al ejecutar la consulta desde backend');
  }
});

//npm install node-cron
//**************** Cron job para actualizar edades todos los días a la medianoche *********************** */ 
/*cron.schedule('00 00 * * *', async () => {
    try {
        //consulta trabaja fecha_nacimiento_alumno con tipo DATE 
        // const query = `
        //   UPDATE registro_alumno
        //   SET edad_alumno = TIMESTAMPDIFF(YEAR, fecha_nacimiento_alumno, CURDATE());
        // `;

        //consulta trabaja fecha_nacimiento_alumno con tipo VARCHAR 
        const query = `UPDATE registro_alumno SET edad_alumno = TIMESTAMPDIFF(YEAR, STR_TO_DATE(fecha_nacimiento_alumno, '%Y-%m-%d'), CURDATE());`;
        conexion.query(query);  // Ejecutar la consulta
        console.log('Edades actualizadas correctamente.');
    } catch (error) {
        console.error('Error al actualizar las edades: ', error);
    }
});*/

/*cron.schedule('50 23 * * *', async () => {
    try {
        //consulta trabaja fecha_nacimiento_alumno con tipo VARCHAR
        const query = `
            UPDATE registro_alumno 
            SET edad_alumno = EXTRACT(YEAR FROM AGE(fecha_nacimiento_alumno::DATE));`;
        db.query(query, (error, result) => {
            if (error) {
                console.error('Error al actualizar las edades: ', error);
            } else {
                console.log('Edades actualizadas correctamente.');
            }
        });
    } catch (error) {
        console.error('Error al actualizar las edades: ', error);
    }
});*/


// Ejemplo de programar el cron job para que se ejecute a las 3:00 PM (15:00 horas) todos los días:
// Si deseas que el cron job se ejecute todos los días a las 3:00 PM, la expresión cron sería:

// Copiar
// 0 15 * * *

// Explicación:
// 0 15 * * *: La expresión cron se desglosa como sigue:
// 0: El minuto (0 minuto de la hora).
// 15: La hora (15 horas, es decir, 3:00 PM).
// *: Cada día del mes.
// *: Cada mes.
// *: Cada día de la semana.
// Si quisieras especificar una hora diferente:
// Para las 9:30 AM: La expresión cron sería 30 9 * * *.
// Para las 11:45 PM (23:45 horas): La expresión cron sería 45 23 * * *.

module.exports = router;