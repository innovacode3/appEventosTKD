const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
//variable router para utilizar la solicitud http (GET/POST/PUT/DELETE) en express
const router = express.Router();
//llamada a la conexión de la base de datos de supabase
const supabase = require('../db/supabaseClient');

//listar todos los delegados (modo administrador)
router.get('/log/administrador/delegacion/lista', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('registro_delegacion')
            .select('*')
            .order('nombre_delegacion', { ascending: false })
        
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: err.message || err });
    }
});

//log obtener delegacion por ID
router.get('/log/delegacion/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from('registro_delegacion')
            .select('*')
            .eq('id_delegacion', id)
            .single();
        
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: err.message || err });
    }
});

// Ruta para que una delegacio se inscriba
router.post('/delegacion/agregar', async (req, res) => {
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

    try {
        // Hash de la contraseña
        const hashedPassword = bcrypt.hashSync(contrasena_delegacion, 10);

        const { data, error } = await supabase.rpc('insertar_delegacion', {
            _nombre_delegacion: nombre_delegacion,
            _nombre_corto_delegacion: nombre_corto_delegacion,
            _telefono_representante: telefono_representante_delegacion,
            _provincia_delegacion: provincia_delegacion,
            _canton_delegacion: canton_delegacion,
            _nombre_representante: nombre_representante_delegacion,
            _cedula_representante: cedula_representante_delegacion,
            _correo_representante: correo_representante_delegacion,
            _contrasena: hashedPassword
        });

        if (error) {
            console.error("RPC Error:", error);
            return res.status(500).json({ error: "Error al procesar la solicitud" });
        }

        // La RPC devuelve un JSON
        if (data.error) {
            return res.status(409).json({ message: data.error });
        }

        return res.status(201).json({
            message: data.message,
            id_delegacion: data.id_delegacion
        });

    } catch (err) {
        return res.status(500).json({ error: err.message || err });
    }
});

// Ruta para que delegacion edite sus datos
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