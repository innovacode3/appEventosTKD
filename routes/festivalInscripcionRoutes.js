const express = require('express');
const router = express.Router();
//conexion supabase
const supabase = require('../db/supabaseClient');

//Obtener alumnos festival inscritos
router.get('/log/delegacion/festival/festival_inscripcion/:id_evento_fk/:id_delegacion_fk', async (req, res) => {
    try {
        const { id_evento_fk, id_delegacion_fk } = req.params;

        const { data, error } = await supabase
            .rpc('get_festival_inscritos', {
                p_evento: id_evento_fk,
                p_delegacion: id_delegacion_fk
            });
        
        if (error) {
            console.error('Error RPC poomsae:', error);
            return res.status(500).json({
                message: 'Error al obtener los inscritos',
                error
            });
        }

        return res.json(data);

    } catch (err) {
        console.error('Error servidor:', err);

        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
})

//Obtener alumno inscrito por id
router.get('/log/delegacion/festival/inscrito/:id_evento_fk/:id_delegacion_fk/:id', async (req, res) => {
    try {
        const { id, id_evento_fk, id_delegacion_fk } = req.params;

        const { data, error } = await supabase
            .from('suscrito_alumno_festival')
            .select('*')
            .eq('id_evento_fk', id_evento_fk)
            .eq('id_delegacion_fk', id_delegacion_fk)
            .eq('id_suscrito_festival', id)
            .single();
        
        if (error) {
            return res.status(404).json({ msg: 'No encontrado' });
        }

        res.json(data);

    } catch (err) {
        console.error('Error servidor:', err);

        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
})

//Verificar si el alumno ya está inscrito por cédula
router.get('/log/delegacion/festival/festival_inscripcion/cedula/:id_evento_fk/:cedula', async (req, res) => {
    try {
        const { id_evento_fk, cedula } = req.params;

        const { data, error } = await supabase
            .from('suscrito_alumno_festival')
            .select('cedula_festival')
            .eq('id_evento_fk', id_evento_fk)
            .eq('cedula_festival', cedula)
            .limit(1);
        
        if (error) {
            console.error('Error Supabase:', error);

            return res.status(500).json({
                message: 'Error al consultar inscripción'
            });
        }

        // Si existe → true | si no → false
        const existe = data && data.length > 0;

        return res.json(existe);

    } catch (err) {
        console.error('Error servidor:', err);

        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
})

//Obtener las inscripciones por la cédula
router.get('/log/delegacion/festival/festival_inscripcion/buscarCedula/:id_evento_fk/:id_delegacion_fk/:cedula', async (req, res) => {
    try {
        const { id_evento_fk, id_delegacion_fk, cedula } = req.params;

        const { data, error } = await supabase
            .from('suscrito_alumno_festival')
            .select('*')
            .eq('id_evento_fk', id_evento_fk)
            .eq('id_delegacion_fk', id_delegacion_fk)
            .eq('cedula_festival', cedula);
        
        if (error) {
            console.error("Error al obtener alumno:", error.message);
            return res.status(500).json({ error: "Error al obtener los datos" });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ mensaje: 'No hay registro con esa cédula' });
        }

        res.json(data);

    } catch (err) {
        console.error('Error servidor:', err);

        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
})

//Inscribir alumnos de festival
router.post('/log/delegacion/festival/inscribir', async (req, res) => {
    try {
        //extraemos y excluimos el id
        const {id_suscrito_festival, ...p} = req.body;

        if (!p || !p.cedula_festival || !p.categoria_alumno_festival) {
            return res.status(400).json({
                ok: false,
                msg: 'Datos incompletos'
            });
        }

        // Validar duplicado
        const { data: existe } = await supabase
            .from('suscrito_alumno_festival')
            .select('id_suscrito_festival')
            .eq('id_evento_fk', p.id_evento_fk)
            .eq('cedula_festival', p.cedula_festival)
            .eq('categoria_alumno_festival', p.categoria_alumno_festival)
            .limit(1);

        if (existe.length > 0) {
            return res.status(400).json({
                ok: false,
                msg: 'Ya está inscrito en esta categoría'
            });
        }

        const { data, error } = await supabase
            .from('suscrito_alumno_festival')
            .insert([p]);

        if (error) throw error;

        res.json({
            ok: true,
            inscrito: data
        });

    } catch (err) {
        console.error('Error servidor:', err);

        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

//Editar alumno inscrito festival
router.put('/log/delegacion/festival/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const p = req.body;

        if (!id) {
            return res.status(400).json({
                ok: false,
                msg: 'ID requerido'
            });
        }

        if (!p || !p.cedula_festival || !p.categoria_alumno_festival) {
            return res.status(400).json({
                ok: false,
                msg: 'Datos incompletos'
            });
        }

        // Validar duplicado (excluyendo el mismo registro)
        const { data: existe } = await supabase
            .from('suscrito_alumno_festival')
            .select('id_suscrito_festival')
            .eq('id_evento_fk', p.id_evento_fk)
            .eq('cedula_festival', p.cedula_festival)
            .eq('categoria_alumno_festival', p.categoria_alumno_festival)
            .neq('id_suscrito_festival', id) // clave aquí
            .limit(1);

        if (existe.length > 0) {
            return res.status(400).json({
                ok: false,
                msg: 'Ya existe otro registro con esa categoría'
            });
        }

        // Actualizar
        const { data, error } = await supabase
            .from('suscrito_alumno_festival')
            .update({
                cedula_festival: p.cedula_festival,
                id_evento_fk: p.id_evento_fk,
                id_delegacion_fk: p.id_delegacion_fk,
                nombres_alumno_festival: p.nombres_alumno_festival,
                apellidos_alumno_festival: p.apellidos_alumno_festival,
                edad_alumno_festival: p.edad_alumno_festival,
                categoria_alumno_festival: p.categoria_alumno_festival,
                genero_alumno_festival: p.genero_alumno_festival,
                cinturon_alumno_festival: p.cinturon_alumno_festival,
                fnacimiento_alumno_festival: p.fnacimiento_alumno_festival
            })
            .eq('id_suscrito_festival', id)
            .select();

        if (error) throw error;

        res.json({
            ok: true,
            actualizado: data
        });

    } catch (err) {
        console.error('Error servidor:', err);

        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

//Eliminar alumno inscrito festival
router.delete('/log/delegacion/festival/eliminar/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                ok: false,
                msg: 'ID requerido'
            });
        }

        // Eliminar registro
        const { data, error } = await supabase
            .from('suscrito_alumno_festival')
            .delete()
            .eq('id_suscrito_festival', id)
            .select(); // 👈 importante para saber qué se eliminó

        if (error) throw error;

        // Validar si existía
        if (!data || data.length === 0) {
            return res.status(404).json({
                ok: false,
                msg: 'Registro no encontrado'
            });
        }

        res.json({
            ok: true,
            eliminado: data
        });

    } catch (err) {
        console.error('Error servidor:', err);

        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

//Obtener la lista de alumnos inscritos por delegacion para admin, public, loguedo
router.get('/evento/lista_alumnos_festival/:id_evento_fk', async (req, res) => {
    try {
        const { id_evento_fk } = req.params;
        
        const { data, error } = await supabase
            .rpc('obtener_alumnos_festival_inscritos', {
                p_id_evento: id_evento_fk
            });
        
        if (error) {
            console.error('Error Supabase:', error);
            return res.status(500).json({
                message: 'Error en la consulta'
            });
        }

        res.json(data);
        
    } catch (err) {
        console.error('Error servidor:', err);

        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
})

//Obtener la lista de alumnos inscritos por delegacion para admin, public, loguedo (id_evento, id_delegacion)
router.get('/evento/lista_alumnos/festival_delegacion/:id_evento_fk/:id_delegacion_fk', async (req, res) => {
    try {
        const { id_evento_fk, id_delegacion_fk } = req.params;

        const { data, error } = await supabase
            .rpc('obtener_alumnos_festival_inscritos_delegacion', {
                p_id_evento: id_evento_fk,
                p_id_delegacion: id_delegacion_fk
            });
        
        if (error) {
            console.error('Error Supabase:', error);
            return res.status(500).json({
                message: 'Error en la consulta'
            });
        }

        res.json(data);

    } catch (err) {
        console.error('Error servidor:', err);

        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
})

//Obtener las categorias en ese evento ordenadas
router.get('/evento/festival/categoriasFiltradas/:id_evento_fk', async (req, res) => {
    try {
        const { id_evento_fk } = req.params;

        const { data, error } = await supabase
            .rpc('get_categorias_festival_ordenadas', {
                p_evento: id_evento_fk
            });

        if (error) {
            console.error('Error Supabase:', error);
            return res.status(500).json({
                message: 'Error en la consulta'
            });
        }

        res.json(data);

    } catch (err) {
        console.error('Error servidor:', err);

        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
})

//Obtener los alumnos inscritos por id_evento, categoria, genero
router.get('/evento/festival/listaInscritosEventoLogPublic/:id_evento_fk/:categoria_alumno_festival/:genero_alumno_festival', async (req, res) => {
    try {
        const { id_evento_fk, categoria_alumno_festival, genero_alumno_festival} = req.params;

        const { data, error } = await supabase
            .rpc('get_listado_festival_log_public', {
                p_evento: id_evento_fk,
                p_categoria: categoria_alumno_festival,
                p_genero: genero_alumno_festival
            });
        
       if (error) {
            console.error('Error Supabase:', error);
            return res.status(500).json({
                message: 'Error en la consulta'
            });
        }

        res.json(data);

    } catch (err) {
        console.error('Error servidor:', err);

        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
})

////////////////////// Modo Administrador /////////////////////
// Agregar resultados
router.post('/evento/festival/premiacion/agregar', async (req, res) => {
    const { p_evento, p_categoria, p_genero, p_datos } = req.body;

    try {
        // Validación básica
        if (!p_evento || !p_categoria || !p_genero || !p_datos) {
            return res.status(400).json({
                error: "Faltan parámetros requeridos"
            });
        }

        // Llamar a la RPC
        const { error } = await supabase.rpc('upsert_premiacion_festival', {
            p_evento,
            p_categoria,
            p_genero,
            p_datos
        });

        if (error) {
            console.error("Error al guardar premiación:", error.message);
            return res.status(500).json({
                error: "Error al guardar la premiación"
            });
        }

        res.json({
            mensaje: "Premiación guardada correctamente"
        });
    } catch(err) {
        console.error('Error servidor:', err);

        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
})

module.exports = router;