const express = require('express');
const dbConnect = require('../db/connect');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
//variable router para utilizar la solicitud http (GET/POST/PUT/DELETE) en express
const router = express.Router();
const delegacionService = require('../services/delegacionService');
//como dbConnect() es una funcion no la puedo aplicar directo, ejemplo: dbConnect().query(query, [correo_administrador], (error, results) => { es incorrecto,
//para eso almaceno en una variable llamada "conexion"
//const conexion = dbConnect();
const db = dbConnect();
//listar todos los delegados (modo administrador)
router.get('/log/administrador/delegacion/lista', (req, res) => {
    const query = 'SELECT * FROM registro_delegacion';
    db.query(query, (error, resultado) => {
        if (error) {
            console.error(error.message);
            return res.status(500).json({ error: error.message });
        }
        if (resultado.rows.length > 0) {
            res.json(resultado.rows);
        } else {
            res.json('No hay registros');
        }
    });
});
//log obtener delegacion por ID
router.get('/log/delegacion/:id', (req, res) => {
    const { id } = req.params;
    const query = `SELECT * FROM registro_delegacion WHERE id_delegacion = $1`;
    db.query(query, [id], (error, resultado) => {
        if (error) {
            console.error(error.message);
            return res.status(500).json({ error: error.message });
        }
        if (resultado.rows.length > 0) {
            res.json(resultado.rows);
        } else {
            res.json('No se ha encontrado el registro con ese ID en la base de datos');
        }
    });
});


//delegados que estan inscritos en un evento se enlistan (publico)------falta editar la consulta
router.get('/public/delegacion/inscrito/lista', (req, res) => {
    const query = `SELECT *, id_evento_fk FROM registro_delegacion`;  // Se ajustó para incluir id_evento_fk
    db.query(query, (error, resultado) => {
        if (error) {
            console.error(error.message);
            return res.status(500).json({ error: error.message });
        }
        if (resultado.rows.length > 0) {
            res.json(resultado.rows);
        } else {
            res.json('No hay registros');
        }
    });
});
//obtener delegacion que esta inscrito en un evento  (publico)------falta editar
router.get('/log/delegacion/inscrito/:id', (req, res) => {
    const { id } = req.params;
    const query = `SELECT * FROM registro_delegacion WHERE id_delegacion = $1`;  // Uso de parámetros con $1
    db.query(query, [id], (error, resultado) => {
        if (error) {
            console.error(error.message);
            return res.status(500).json({ error: error.message });
        }
        if (resultado.rows.length > 0) {
            res.json(resultado.rows);
        } else {
            res.json('No se ha encontrado el registro con ese ID en la base de datos');
        }
    });
});
// Ruta para que una delegacio se inscriba
router.post('/delegacion/agregar', (req, res) => {
    const { 
        nombre_delegacion,
        nombre_corto_delegacion,
        telefono_representante_delegacion,
        provincia_delegacion,
        canton_delegacion,
        nombre_representante_delegacion,
        cedula_representante_delegacion,
        correo_representante_delegacion,
        contrasena_delegacion
    } = req.body;
    // Primero se verifica si el nombre_delegacion ya está registrado
    const checkNombreDelegacionQuery = `SELECT COUNT(*) AS count FROM registro_delegacion WHERE nombre_delegacion = $1`;
    // Después se verifica si el correo_representante_delegacion ya está registrado
    const checkCorreoDelegacionQuery = `SELECT COUNT(*) AS count FROM registro_delegacion WHERE correo_representante_delegacion = $1`;
    // Se ejecutan ambas consultas
    db.query(checkNombreDelegacionQuery, [nombre_delegacion], (error, resultsNombre) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        // Verificar si el nombre_delegacion ya está en uso
        if (resultsNombre.rows[0].count > 0) {
            // Si el nombre ya está en uso, verificamos si el correo también lo está
            db.query(checkCorreoDelegacionQuery, [correo_representante_delegacion], (error, resultsCorreo) => {
                if (error) {
                    return res.status(500).json({ error: error.message });
                }
                // Si el correo también está en uso, devolvemos el mensaje combinado
                if (resultsCorreo.rows[0].count > 0) {
                    return res.status(409).json({ message: 'Nombre de delegación y correo ya en uso' });
                } else {
                    // Si solo el nombre está en uso, devolvemos el mensaje correspondiente
                    return res.status(409).json({ message: 'El nombre de la delegación ya está en uso.' });
                }
            });
        } else {
            // Si el nombre no está en uso, verificamos si el correo está en uso
            db.query(checkCorreoDelegacionQuery, [correo_representante_delegacion], (error, resultsCorreo) => {
                if (error) {
                    return res.status(500).json({ error: error.message });
                }
                // Si el correo está en uso, devolvemos el mensaje correspondiente
                if (resultsCorreo.rows[0].count > 0) {
                    return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });
                }
                // Si no hay problemas con el nombre o correo, hasheamos la contraseña
                const hashedPassword = bcrypt.hashSync(contrasena_delegacion, 10);
                const query = `
                    INSERT INTO registro_delegacion (
                        nombre_delegacion, 
                        nombre_corto_delegacion, 
                        telefono_representante_delegacion, 
                        provincia_delegacion, 
                        canton_delegacion, 
                        nombre_representante_delegacion, 
                        cedula_representante_delegacion, 
                        correo_representante_delegacion, 
                        contrasena_delegacion
                    ) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id_delegacion`;
                db.query(query, [
                    nombre_delegacion, 
                    nombre_corto_delegacion, 
                    telefono_representante_delegacion, 
                    provincia_delegacion, 
                    canton_delegacion, 
                    nombre_representante_delegacion, 
                    cedula_representante_delegacion, 
                    correo_representante_delegacion, 
                    hashedPassword
                ], (error, results) => {
                    if (error) {
                        return res.status(500).json({ error: error.message });
                    }
                    res.status(201).json({ message: 'Usuario delegación creado exitosamente', id: results.rows[0].id_delegacion });
                });
            });
        }
    });
});
// Ruta para que delegacion edite sus datos
/*router.put('/log/delegacion/editar/:id', (req, res) => {
    const { id } = req.params;
    const {
        nombre_delegacion,
        nombre_corto_delegacion,
        telefono_representante_delegacion,
        provincia_delegacion,
        canton_delegacion,
        nombre_representante_delegacion,
        cedula_representante_delegacion,
        correo_representante_delegacion
    } = req.body;
    // Primero, obtener los datos actuales de la delegación desde la base de datos
    const getDelegacionQuery = 'SELECT nombre_delegacion, correo_representante_delegacion FROM registro_delegacion WHERE id_delegacion = $1';
    db.query(getDelegacionQuery, [id], (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        // Si no se encuentra la delegación, devolver un error
        if (results.rows.length === 0) {
            return res.status(404).json({ message: 'Delegación no encontrada' });
        }
        const currentDelegacion = results.rows[0];
        // Variables para controlar si los campos han cambiado
        const isNombreDelegacionChanged = nombre_delegacion && nombre_delegacion !== currentDelegacion.nombre_delegacion;
        const isCorreoRepresentanteChanged = correo_representante_delegacion && correo_representante_delegacion !== currentDelegacion.correo_representante_delegacion;
        // Crear una lista de consultas a ejecutar según los campos modificados
        const queries = [];
        if (isNombreDelegacionChanged) {
            // Validar si el nombre_delegacion ya está registrado (si es que ha cambiado)
            queries.push({
                query: 'SELECT COUNT(*) AS count FROM registro_delegacion WHERE nombre_delegacion = $1',
                params: [nombre_delegacion]
            });
        }
        if (isCorreoRepresentanteChanged) {
            // Validar si el correo_representante_delegacion ya está registrado (si es que ha cambiado)
            queries.push({
                query: 'SELECT COUNT(*) AS count FROM registro_delegacion WHERE correo_representante_delegacion = $1',
                params: [correo_representante_delegacion]
            });
        }
        // Si alguna de las validaciones está definida, ejecutamos las consultas de validación
        if (queries.length > 0) {
            // Ejecutar las validaciones una por una
            let validationResults = [];
            let executedQueries = 0;
            queries.forEach((q) => {
                db.query(q.query, q.params, (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    validationResults.push(result.rows[0].count);
                    executedQueries++;
                    // Si todas las validaciones están completas, revisamos los resultados
                    if (executedQueries === queries.length) {
                        if (validationResults[0] > 0) {
                            return res.status(409).json({ message: 'El nombre de la delegación ya está en uso.' });
                        }
                        if (validationResults[1] > 0) {
                            return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });
                        }
                        // Si todas las validaciones pasaron, se actualizan los datos
                        delegacionService.actualizarDelegacion(id, nombre_delegacion, nombre_corto_delegacion, telefono_representante_delegacion, provincia_delegacion, canton_delegacion, nombre_representante_delegacion, cedula_representante_delegacion, correo_representante_delegacion, (err, result) => {
                            if (err) {
                                return res.status(500).json({ error: err.message });
                            }
                            res.json(result); // Responder con éxito
                        });
                    }
                });
            });
        } else {
            // Si no hubo cambios en nombre_delegacion ni en correo_representante_delegacion, se actualiza directamente
            delegacionService.actualizarDelegacion(id, nombre_delegacion, nombre_corto_delegacion, telefono_representante_delegacion, provincia_delegacion, canton_delegacion, nombre_representante_delegacion, cedula_representante_delegacion, correo_representante_delegacion, (err, result) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json(result); // Responder con éxito
            });
        }
    });
});*/
router.put('/log/delegacion/editar/:id', async (req, res) => {
  const { id } = req.params;
  const {
    nombre_delegacion,
    nombre_corto_delegacion,
    telefono_representante_delegacion,
    provincia_delegacion,
    canton_delegacion,
    nombre_representante_delegacion,
    cedula_representante_delegacion,
    correo_representante_delegacion
  } = req.body;

  try {
    // Obtener datos actuales
    const { rows } = await db.query(
      'SELECT nombre_delegacion, correo_representante_delegacion FROM registro_delegacion WHERE id_delegacion = $1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Delegación no encontrada' });
    }

    const current = rows[0];

    // Validaciones
    if (nombre_delegacion && nombre_delegacion !== current.nombre_delegacion) {
      const { rows: nombreExists } = await db.query(
        'SELECT 1 FROM registro_delegacion WHERE nombre_delegacion = $1 AND id_delegacion != $2',
        [nombre_delegacion, id]
      );
      if (nombreExists.length > 0) {
        return res.status(409).json({ message: 'El nombre de la delegación ya está en uso.' });
      }
    }

    if (correo_representante_delegacion && correo_representante_delegacion !== current.correo_representante_delegacion) {
      const { rows: correoExists } = await db.query(
        'SELECT 1 FROM registro_delegacion WHERE correo_representante_delegacion = $1 AND id_delegacion != $2',
        [correo_representante_delegacion, id]
      );
      if (correoExists.length > 0) {
        return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });
      }
    }

    // Actualizar la delegación
    const updateQuery = `
      UPDATE registro_delegacion SET
        nombre_delegacion = $1,
        nombre_corto_delegacion = $2,
        telefono_representante_delegacion = $3,
        provincia_delegacion = $4,
        canton_delegacion = $5,
        nombre_representante_delegacion = $6,
        cedula_representante_delegacion = $7,
        correo_representante_delegacion = $8
      WHERE id_delegacion = $9
      RETURNING *;
    `;

    const values = [
      nombre_delegacion,
      nombre_corto_delegacion,
      telefono_representante_delegacion,
      provincia_delegacion,
      canton_delegacion,
      nombre_representante_delegacion,
      cedula_representante_delegacion,
      correo_representante_delegacion,
      id
    ];

    const updateResult = await db.query(updateQuery, values);
    res.json(updateResult.rows[0]);

  } catch (error) {
    console.error('Error al actualizar delegación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// Ruta para eliminar una delegacion (mod admin)
/*router.delete('/log/administrador/delegacion/borrar/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM registro_delegacion WHERE id_delegacion = $1';
    db.query(query, [id], (error, result) => {
        if (error) {
            return console.error(error.message);
        }
        res.json('Se eliminó correctamente la delegación');
    });
});*/

router.delete('/log/administrador/delegacion/borrar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Primero eliminar de las tablas relacionadas
        const deleteAlumno = 'DELETE FROM registro_alumno WHERE id_delegacion_fk = $1';
        await db.query(deleteAlumno, [id]);

        const deleteCombate = 'DELETE FROM suscrito_alumno_evento WHERE id_delegacion_fk = $1';
        await db.query(deleteCombate, [id]);

        const deletePoomsae = 'DELETE FROM suscrito_alumno_poomsae WHERE id_delegacion_fk = $1';
        await db.query(deletePoomsae, [id]);

        // Luego eliminar la delegacion
        const deleteDelegacion = 'DELETE FROM registro_delegacion WHERE id_delegacion = $1';
        await db.query(deleteDelegacion, [id]);

        res.json('Se eliminó correctamente la delegación');
    } catch (error) {
        console.error('Error al eliminar la delegación:', error);
        res.status(500).json({ error: 'Error al eliminar la delegación' });
    }

})

/*************************************************LOGIN DELEGACION*************************************************/
//ruta para loguearse (entrar al sistema con sus credenciales que provienen del frontend)
//aqui se genera un token el cual se almacena en el local storage
router.post('/login/delegacion', (req, res) => {
    const { correo_representante_delegacion, contrasena_delegacion } = req.body;
    // Verificar correo
    const query = 'SELECT * FROM registro_delegacion WHERE correo_representante_delegacion = $1';
    db.query(query, [correo_representante_delegacion], (error, results) => {
        if (error) return res.status(500).json({ error: error.message });
        if (results.rows.length === 0) return res.status(401).json({ message: 'Credenciales incorrectas' });

        const usuario = results.rows[0];

        // Verificar la contraseña
        if (bcrypt.compareSync(contrasena_delegacion, usuario.contrasena_delegacion)) {
            // Generar el token con el ID de delegación
            const token = jwt.sign({ id: usuario.id_delegacion }, 'mi_clave_secreta', { expiresIn: '2h' });
            res.json({ token });
        } else {
            res.status(401).json({ message: 'Credenciales incorrectas' });
        }
    });
});

//editar contraseña delegacion(delegacion edita su propia contrasena)
router.put('/log/delegacion/editar/contrasena/:id', (req, res) => {
    const { id } = req.params;
    const { contrasena_actual, contrasena_nueva } = req.body;
    // Consultar la contraseña almacenada en la base de datos
    const query = 'SELECT contrasena_delegacion FROM registro_delegacion WHERE id_delegacion = $1';
    db.query(query, [id], (error, results) => {
        if (error) return res.status(500).json({ error: error.message });
        if (results.rows.length === 0) {
            return res.status(404).json({ message: 'Administrador no encontrado' });
        }
        const usuario = results.rows[0];
        // Comparar las contraseñas usando bcrypt
        bcrypt.compare(contrasena_actual, usuario.contrasena_delegacion, (err, isMatch) => {
            if (err) return res.status(500).json({ message: 'Error al comparar contraseñas' });
            // Si las contraseñas no coinciden
            if (!isMatch) {
                return res.status(401).json({ message: 'La contraseña actual no es correcta' });
            }
            // Si las contraseñas coinciden, hashear la nueva contraseña
            const hashedNewPassword = bcrypt.hashSync(contrasena_nueva, 10);
            // Actualizar la contraseña en la base de datos
            const updateQuery = 'UPDATE registro_delegacion SET contrasena_delegacion = $1 WHERE id_delegacion = $2';
            db.query(updateQuery, [hashedNewPassword, id], (error) => {
                if (error) return res.status(500).json({ error: error.message });
                res.json({ message: 'Contraseña actualizada correctamente' });
            });
        });
    });
});

module.exports = router;