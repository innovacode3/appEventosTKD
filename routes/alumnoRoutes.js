const express = require('express');
//variable router para utilizar la solicitud http (GET/POST/PUT/DELETE) en express
const router = express.Router();
//llamada a la conexión de la base de datos de supabase
const supabase = require('../db/supabaseClient');

//listar todos los alumnos (modo logueado administrador)
router.get('/log/administrador/alumno/lista', async (req, res) => {
    try {
        const {data, error} = await supabase
            .from('registro_alumno')
            .select('*')

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: err.message || err });
    }
})

//obtener alumnos desde mod delegacion
router.get('/log/delegacion/alumno/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .rpc('obtener_alumnos_ordenados', { id_delegacion: id });
        
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message || err });
    }
});


//obtener alumnos desde mod admin
router.get('/log/administrador/delegacion/alumnos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .rpc('obtener_alumnos_por_delegacion', { _id: id });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message || err });
    }
});


//log obtener alumno por id_alumno
router.get('/log/delegacion/un_alumno/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const {data, error} = await supabase
            .from('registro_alumno')
            .select('*')
            .eq('id_alumno', id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message || err });
    }
})

//agregar un alumno
router.post('/log/delegacion/alumno/agregar', async (req, res) => {
  try {
    const {
      id_delegacion_fk,
      nombre_alumno,
      apellido_alumno,
      cedula_alumno,
      fecha_nacimiento_alumno,
      edad_alumno,
      genero_alumno,
      cinturon_alumno,
    } = req.body;

    // LLAMADA CORRECTA A RPC
    const { data, error } = await supabase.rpc('insertar_alumno_solo', {
      _id_delegacion_fk: id_delegacion_fk,
      _nombre_alumno: nombre_alumno,
      _apellido_alumno: apellido_alumno,
      _cedula_alumno: cedula_alumno,
      _fecha_nacimiento: fecha_nacimiento_alumno,
      _edad: edad_alumno,
      _genero: genero_alumno,
      _cinturon: cinturon_alumno
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      return res.status(400).json({
        ok: false,
        msg: error.message
      });
    }

    res.json({ ok: true, data });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({
      ok: false,
      msg: 'Error interno del servidor'
    });
  }
});


//actualizar un alumno
router.put('/log/delegacion/alumno/editar/:id', async (req, res) => {
    const { id } = req.params;

    const {
        id_delegacion_fk,
        nombre_alumno,
        apellido_alumno,
        cedula_alumno,
        fecha_nacimiento_alumno,
        edad_alumno,
        genero_alumno,
        cinturon_alumno
    } = req.body;

    try {
        const { data, error } = await supabase.rpc('actualizar_alumno', {
            _id_alumno: Number(id),                   // <-- CORREGIDO
            _id_delegacion_fk: Number(id_delegacion_fk),   // <-- IMPORTANTE
            _nombre_alumno: nombre_alumno,
            _apellido_alumno: apellido_alumno,
            _cedula_alumno: cedula_alumno,
            _fecha_nacimiento: fecha_nacimiento_alumno,
            _edad: Number(edad_alumno),               // <-- IMPORTANTE
            _genero: genero_alumno,
            _cinturon: cinturon_alumno
        });

        if (error) {
            console.error('Supabase RPC error:', error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ ok: true, data });

    } catch (err) {
        res.status(500).json({ error: err.message || err });
    }
});

//eliminar un alumno
router.delete('/log/delegacion/alumno/borrar/:cedula', async (req, res) => {
    const { cedula } = req.params;
    const { data, error } = await supabase.rpc('borrar_alumno', {
        cedula_input: cedula
    });
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.json(data);
});

//Obtener un alumno por cédula
router.get('/log/delegacion/registro_alumno/ced/:id_delegacion_fk/:cedula', async (req, res) => {
    const { id_delegacion_fk , cedula } = req.params;
    try {
        const { data, error } = await supabase
            .from('registro_alumno')
            .select('*')
            .eq('id_delegacion_fk', id_delegacion_fk)
            .eq('cedula_alumno', cedula)
            .single()
        
        if (error) {
          console.error("Error al obtener alumno:", error.message);
          return res.status(500).json({ error: "Error al obtener los datos" });
        }
        if (!data) {
            return res.status(404).json({ mensaje: 'No hay registro con esa cédula' });
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: err.message || err });
    }
});

//Endpoint para que se actualice automaticamente desde vercel
router.get('/prueba-cron', async (req, res) => {
  try {
    // Ejecutamos directamente la actualización en Supabase
    const { error } = await supabase.rpc('actualizar_edades_alumnos');

    if (error) {
      console.error('RPC error:', error);
      return res.status(500).json({ error: 'Error ejecutando RPC en Supabase' });
    }

    res.send('Cron ejecutado: edades actualizadas correctamente');
  } catch (err) {
    console.error('Error inesperado:', err);
    res.status(500).send('Error interno al ejecutar el cron');
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