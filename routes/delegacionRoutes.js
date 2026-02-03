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
            .order('nombre_delegacion', { ascending: true })
        
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
        const { data, error } = await supabase.rpc('actualizar_delegacion', {
        _id_delegacion: Number(id),
        _nombre_delegacion: nombre_delegacion,
        _nombre_corto: nombre_corto_delegacion,
        _telefono_representante: telefono_representante_delegacion,
        _provincia: provincia_delegacion,
        _canton: canton_delegacion,
        _nombre_representante: nombre_representante_delegacion,
        _cedula_representante: cedula_representante_delegacion,
        _correo_representante: correo_representante_delegacion
        });

        if (error) {
            console.error('Supabase RPC error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.json({ ok: true, data });

    } catch (err) {
        res.status(500).json({ error: err.message || err });
    }
});

// Ruta para eliminar una delegacion (mod admin)
router.delete('/log/administrador/delegacion/borrar/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Eliminar alumnos relacionados
    const { error: errorAlumno } = await supabase
      .from('registro_alumno')
      .delete()
      .eq('id_delegacion_fk', id);

    if (errorAlumno) {
      console.error('Error al eliminar alumnos:', errorAlumno.message);
      return res.status(500).json({ message: 'Error al eliminar alumnos de la delegación' });
    }

    // Eliminar combates relacionados
    const { error: errorCombate } = await supabase
      .from('suscrito_alumno_evento')
      .delete()
      .eq('id_delegacion_fk', id);

    if (errorCombate) {
      console.error('Error al eliminar combates:', errorCombate.message);
      return res.status(500).json({ message: 'Error al eliminar eventos de la delegación' });
    }

    // Eliminar poomsae relacionados
    const { error: errorPoomsae } = await supabase
      .from('suscrito_alumno_poomsae')
      .delete()
      .eq('id_delegacion_fk', id);

    if (errorPoomsae) {
      console.error('Error al eliminar poomsae:', errorPoomsae.message);
      return res.status(500).json({ message: 'Error al eliminar poomsae de la delegación' });
    }

    // Eliminar la delegación
    const { data, error: errorDelegacion } = await supabase
      .from('registro_delegacion')
      .delete()
      .eq('id_delegacion', id)
      .select(); // importante para saber si se eliminó algo

    if (errorDelegacion) {
      console.error('Error al eliminar delegación:', errorDelegacion.message);
      return res.status(500).json({ message: 'Error al eliminar la delegación' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'Delegación no encontrada' });
    }

    // OK
    res.json({ message: 'Se eliminó correctamente la delegación' });

  } catch (err) {
    console.error('Error inesperado:', err);
    res.status(500).json({ error: err.message || err });
  }
});


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