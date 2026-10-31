const express = require('express');
const router = express.Router();
//Conexion Supabase
const supabase = require('..//db/supabaseClient');

//Obtener alumnos campamento inscritos
router.get('/log/delegacion/campamento/campamento_inscripcion/:id_evento_fk/:id_delegacion_fk', async (req, res) => {
    try {
        const {id_evento_fk, id_delegacion_fk} = req.params;

        const {data, error} = await supabase
            .rpc('suscrito_alumno_campamento', {
                p_evento: id_evento_fk,
                p_delegacion: id_delegacion_fk
            })
        
        if (error) {
            console.error('Error RPC campamento:', error);
            return res.status(500).json({
                message: 'Error al obtener los inscritos de campamento',
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

//Obtener alumno campamento por id
router.get('/log/delegacion/campamento/inscrito/:id_evento_fk/:id_delegacion_fk/:id', async (req, res) => {
    try {
        const {id, id_evento_fk, id_delegacion_fk} = req.params;

        const {data, error} = await supabase
            .from('suscrito_alumno_campamento')
            .select('*')
            .eq('id_evento_fk', id_evento_fk)
            .eq('id_delegacion_fk', id_delegacion_fk)
            .eq('id_suscrito_alumno_campamento', id)
            .single();
        
        if (error) {
            return res.status(404).json({ msg: 'No encontrado campamento' });
        }

        res.json(data);

    } catch (err) {
        console.error('Error servidor:', err);

        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
})

//Verificar si el alumno campamento esta inscrito por cédula
router.get('/log/delegacion/campamento/campamento_inscripcion/cedula/:id_evento_fk/:cedula', async (req, res) => {
    try {
        const {id_evento_fk, cedula} = req.params;

        const {data, error} = await supabase
            .from('suscrito_alumno_campamento')
            .select('cedula_suscrito_alumno_campamento')
            .eq('id_evento_fk', id_evento_fk)
            .eq('cedula_suscrito_alumno_campamento', cedula)
            .limit(1);
        
        if (error) {
            console.error('Error Supabase:', error);

            return res.status(500).json({
                message: 'Error al consultar inscripción de campamento'
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

//Obtener las inscripciones por la cedula
router.get('/log/delegacion/campamento/campamento_inscripcion/buscarCedula/:id_evento_fk/:id_delegacion_fk/:cedula', async (req, res) => {
    try{
        const { id_evento_fk, id_delegacion_fk, cedula } = req.params;

        const {data, error} = await supabase
            .from('suscrito_alumno_campamento')
            .select('*')
            .eq('id_evento_fk', id_evento_fk)
            .eq('id_delegacion_fk', id_delegacion_fk)
            .eq('cedula_suscrito_alumno_campamento', cedula);
        
        if (error) {
            console.error("Error al obtener alumno de campamento:", error.message);
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

//Inscribir alumnos de campamento
router.post('/log/delegacion/campamento/inscribir', async (req, res) => {
    try {
        //extraemos y excluimos el id
        const {id_suscrito_alumno_campamento, ...p} = req.body;

        if (!p || !p.cedula_suscrito_alumno_campamento || !p.nombre_categoria_alumno_campamento) {
            return res.status(400).json({
                ok: false,
                msg: 'Datos incompletos'
            });
        }

        //valor duplicado
        const {data: existe} = await supabase
            .from('suscrito_alumno_campamento')
            .select('id_suscrito_alumno_campamento')
            .eq('id_evento_fk', p.id_evento_fk)
            .eq('cedula_suscrito_alumno_campamento', p.cedula_suscrito_alumno_campamento)
            .eq('nombre_categoria_alumno_campamento', p.nombre_categoria_alumno_campamento)
            .limit(1);
        
        if (existe.length > 0) {
            return res.status(400).json({
                ok: false,
                msg: 'Ya está inscrito en esta categoría de campemento'
            });
        }

        const { data, error } = await supabase
            .from('suscrito_alumno_campamento')
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
})

//Editar alumno inscrito campamento
router.put('/log/delegacion/campamento/editar/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const p = req.body;

        if (!id) {
            return res.status(400).json({
                ok: false,
                msg: 'ID requerido'
            });
        }

        if (!p || !p.cedula_suscrito_alumno_campamento || p.nombre_categoria_alumno_campamento) {
            return res.status(400).json({
                ok: false,
                msg: 'Datos incompletos'
            });
        }

        // Validar duplicado (excluyendo el mismo registro)
        const {data: existe} = await supabase
            .from('suscrito_alumno_campamento')
            .select('id_suscrito_alumno_campamento')
            .eq('id_evento_fk', p.id_evento_fk)
            .eq('cedula_suscrito_alumno_campamento', p.cedula_suscrito_alumno_campamento)
            .eq('nombre_categoria_alumno_campamento', p.nombre_categoria_alumno_campamento)
            .neq('id_suscrito_alumno_campamento', id) // clave aquí
            .limit(1);
        
        if (existe.length > 0) {
            return res.status(400).json({
                ok: false,
                msg: 'Ya existe otro registro con esa categoría'
            });
        }

        //Actualizar
        const {data, error} = await supabase
            .from('suscrito_alumno_campamento')
            .update({
                cedula_suscrito_alumno_campamento: p.cedula_suscrito_alumno_campamento,
                id_evento_fk: p.id_evento_fk,
                id_delegacion_fk: p.id_delegacion_fk,
                nombres_suscrito_alumno_campamento: p.nombres_suscrito_alumno_campamento,
                apellidos_suscrito_alumno_campamento: p.apellidos_suscrito_alumno_campamento,
                fnac_suscrito_alumno_campamento: p.fnac_suscrito_alumno_campamento,
                edad_suscrito_alumno_campamento: p.edad_suscrito_alumno_campamento,
                nombre_categoria_alumno_campamento: p.nombre_categoria_alumno_campamento,
                genero_suscrito_alumno_campamento: p.genero_suscrito_alumno_campamento,
                cinturon_suscrito_alumno_campamento: p.cinturon_suscrito_alumno_campamento
            })
            .eq('id_suscrito_alumno_campamento', id)
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
})

//Eliminar alumno inscrito campamento
router.delete('/log/delegacion/campamento/eliminar/:id', async (req, res) => {
    try{
        const {id} = req.params;

        if (!id) {
            return res.status(400).json({
                ok: false,
                msg: 'ID requerido'
            });
        }

        //Eliminar registro
        const {data, error} = await supabase
            .from('suscrito_alumno_campamento')
            .delete()
            .eq('id_suscrito_alumno_campamento', id)
            .select(); //importante para saber qué se eliminó
        
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
})

//Obtener la lista de alumnos inscritos por evento para admin, public, logueado (ver inscritos)
router.get('/evento/lista_alumnos_campamento/:id_evento_fk', async (req, res) => {
    try {
        const {id_evento_fk} = req.params;

        const { data, error } = await supabase
            .rpc('obtener_alumnos_campamento_inscritos', {
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

//Obtener la lista de alumnos inscritos por evento y delegacion para admin, public, logueado (cuando ya está inscrito)


//Obtener las categorias en ese evento ordenados


//Obtener los alumnos inscritos por evento, categoria, genero


module.exports = router;