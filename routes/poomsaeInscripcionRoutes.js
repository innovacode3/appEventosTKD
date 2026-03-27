const express = require('express');
const dbConnect = require('../db/connect');
const router = express.Router();
const db = dbConnect();
// conexión supabase
const supabase = require('../db/supabaseClient');
const crypto = require('crypto');

//Obtener alumnos poomsae inscritos
router.get('/log/delegacion/evento/poomsae/poomsae_inscripcion/:id_evento_fk/:id_delegacion_fk', async (req, res) => {

    try {

        const { id_evento_fk, id_delegacion_fk } = req.params;

        const { data, error } = await supabase
            .rpc('get_poomsae_inscritos_ordenados', {
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

});

//Para obtener el alumno inscrito por id
router.get('/log/delegacion/evento/poomsae/inscrito/:id_evento_fk/:id_delegacion_fk/:id', async (req, res) => {

    const { id, id_evento_fk, id_delegacion_fk } = req.params;

    const { data, error } = await supabase
        .from('suscrito_alumno_poomsae')
        .select('*')
        .eq('id_evento_fk', id_evento_fk)
        .eq('id_delegacion_fk', id_delegacion_fk)
        .eq('id_suscrito_alumno_poomsae', id)
        .single();

    if (error) {
        return res.status(404).json({ msg: 'No encontrado' });
    }

    res.json(data);

});

//Para obtener el equipo
router.get('/log/delegacion/evento/poomsae/equipo/:id', async (req, res) => {

    const { id } = req.params;

    const { data } = await supabase
        .from('suscrito_alumno_poomsae')
        .select('*')
        .eq('equipo_id', id);

    res.json(data);

});

// Verificar si el alumno ya está inscrito por cédula
router.get('/log/delegacion/evento/poomsae/poomsae_Inscripcion/cedula/:id_evento_fk/:cedula', async (req, res) => {
    try {

        const { id_evento_fk, cedula } = req.params;

        const { data, error } = await supabase
            .from('suscrito_alumno_poomsae')
            .select('cedula_suscrito_alumno_poomsae, modalidad')
            .eq('id_evento_fk', id_evento_fk)
            .eq('cedula_suscrito_alumno_poomsae', cedula)
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

});

//Obtener las inscripciones pero por la cedula
router.get('/log/delegacion/evento/poomsae/poomsaeInscripcion/buscarCedula/:id_evento_fk/:cedula', async (req, res) => {
    const { id_evento_fk, cedula } = req.params;
    try {
        const { data, error } = await supabase
            .from('suscrito_alumno_poomsae')
            .select('*')
            .eq('id_evento_fk', id_evento_fk)
            .eq('cedula_suscrito_alumno_poomsae', cedula);
        if (error) {
            console.error("Error al obtener alumno:", error.message);
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        if (!data || data.length === 0) {
            return res.status(404).json({ mensaje: 'No hay registro con esa cédula' });
        }
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message || err });
    }
})


// INSCRIBIR POOMSAE (INDIVIDUAL / MIXTO / EQUIPO / FREESTYLE)
router.post('/log/delegacion/evento/poomsae/inscribir', async (req, res) => {
    try {
        const {modalidad, participantes } = req.body; //participantes es un array

        if (!modalidad || !Array.isArray(participantes) || participantes.length === 0) {
            return res.status(400).json({
                ok: false,
                msg: 'Datos incompletos'
            });
        }

        const {
            id_evento_fk
        } = participantes[0];

        // INDIVIDUAL
        if (modalidad === 'Individual' || modalidad === 'Freestyle-Individual') {

            if (participantes.length !== 1) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Debe existir un solo participante'
                });
            }

            const p = participantes[0];

            // Validar categoría repetida
            const { data: existe } = await supabase
                .from('suscrito_alumno_poomsae')
                .select('id_suscrito_alumno_poomsae')
                .eq('id_evento_fk', p.id_evento_fk)
                .eq('cedula_suscrito_alumno_poomsae', p.cedula_suscrito_alumno_poomsae)
                .eq('modalidad', modalidad)
                .eq('categoria_suscrito_alumno_poomsae', p.categoria_suscrito_alumno_poomsae)
                .limit(1);

            if (existe.length > 0) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Ya está inscrito en esta categoría'
                });
            }
        }

        // MIXTO
        if (modalidad === 'Mixto' || modalidad === 'Freestyle-Mixto') {

            if (participantes.length !== 2) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Debe registrar exactamente 2 participantes'
                });
            }

            const categorias = new Set();
            const generos = new Set();
            const cinturones = new Set();

            participantes.forEach(p => {
                categorias.add(p.categoria_suscrito_alumno_poomsae);
                generos.add(p.genero_suscrito_alumno_poomsae);
                cinturones.add(p.cinturon_suscrito_alumno_poomsae);
            });

            if (categorias.size !== 1) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Ambos deben ser de la misma categoría'
                });
            }

            if (cinturones.size !== 1) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Ambos deben tener el mismo cinturón'
                });
            }

            if (!(generos.has('Masculino') && generos.has('Femenino'))) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Debe haber un masculino y una femenina'
                });
            }
        }

        // EQUIPO
        if (modalidad === 'Equipo' || modalidad === 'Freestyle-Equipo') {

            if (participantes.length !== 3) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Debe registrar exactamente 3 participantes'
                });
            }

            const categorias = new Set();
            const generos = new Set();
            const cinturones = new Set();

            participantes.forEach(p => {
                categorias.add(p.categoria_suscrito_alumno_poomsae);
                generos.add(p.genero_suscrito_alumno_poomsae);
                cinturones.add(p.cinturon_suscrito_alumno_poomsae);
            });

            if (categorias.size !== 1) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Todos deben ser de la misma categoría'
                });
            }

            if (cinturones.size !== 1) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Todos deben tener el mismo cinturón'
                });
            }

            if (generos.size !== 1) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Todos deben ser del mismo género'
                });
            }
        }


        const equipo_id = crypto.randomUUID();

        const registros = participantes.map(p => ({

            cedula_suscrito_alumno_poomsae: p.cedula_suscrito_alumno_poomsae,
            id_evento_fk: p.id_evento_fk,
            id_delegacion_fk: p.id_delegacion_fk,

            nombres_suscrito_alumno_poomsae: p.nombres_suscrito_alumno_poomsae,
            apellidos_suscrito_alumno_poomsae: p.apellidos_suscrito_alumno_poomsae,

            edad_suscrito_alumno_poomsae: p.edad_suscrito_alumno_poomsae,
            categoria_suscrito_alumno_poomsae: p.categoria_suscrito_alumno_poomsae,
            genero_suscrito_alumno_poomsae: p.genero_suscrito_alumno_poomsae,
            cinturon_suscrito_alumno_poomsae: p.cinturon_suscrito_alumno_poomsae,
            fnacimiento_suscrito_alumno_poomsae: p.fnacimiento_suscrito_alumno_poomsae,

            modalidad,
            equipo_id

        }));


        const { data, error } = await supabase
            .from('suscrito_alumno_poomsae')
            .insert(registros);

        if (error) throw error;


        res.json({
            ok: true,
            inscritos: data
        });


    } catch (err) {

        console.error(err);

        res.status(500).json({
            ok: false,
            msg: 'Error interno'
        });
    }

});


//Listar inscritos por modalidad
router.get('/log/delegacion/evento/poomsae/lista/:id_evento_fk/:id_delegacion_fk/:modalidad', async (req, res) => {
    try {
        const { id_evento_fk, id_delegacion_fk, modalidad } = req.params;

        const { data, error } = await supabase
            .from('suscrito_alumno_poomsae')
            .select('*')
            .eq('id_evento_fk', id_evento_fk)
            .eq('id_delegacion_fk', id_delegacion_fk)
            .eq('modalidad', modalidad)
            .order('apellidos_suscrito_alumno_poomsae', { ascending: true });

        if (error) throw error;
        res.json(data);

    } catch (err) {
        res.status(500).json({ error: err.message || err });
    }
});

//Editar alumno inscrito poomsae
router.put('/log/delegacion/evento/poomsae/poomsae_Inscripcion/actualizar/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const {
            categoria_suscrito_alumno_poomsae,
        } = req.body;

        // Update con Supabase
        const { data, error } = await supabase
            .from('suscrito_alumno_poomsae')
            .update({
                categoria_suscrito_alumno_poomsae
            })
            .eq('id_suscrito_alumno_poomsae', id)
            .select()
            .single();


        if (error) {
            console.error('Error Supabase:', error);
            return res.status(500).json({
                message: 'Error al actualizar el alumno'
            });
        }

        // No encontró registro
        if (!data) {
            return res.status(404).json({ message: 'Alumno no encontrado' });
        }

        return res.json({
            message: 'Se actualizó correctamente el alumno inscrito',
            data
        });

    } catch (err) {
        console.error('Error servidor:', err);

        return res.status(500).json({ message: 'Error interno del servidor' });
    }
});

//Eliminar alumno inscrito poomsae
router.delete('/log/delegacion/evento/poomsae/poomsae_Inscripcion/eliminar/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('suscrito_alumno_poomsae')
            .delete()
            .eq('id_suscrito_alumno_poomsae', id)

        if (error) {
            console.error("Error al eliminar la inscripción de poomsae:", error.message);
            return res.status(500).json({ error: "Error al eliminar los datos" });
        }
        res.json({ message: 'Inscripción eliminada correctamente' });

    } catch (err) {
        res.status(500).json({ error: err.message || err });
    }
});

//Eliminar grupos
router.delete('/poomsae/grupo/:equipo_id', async (req, res) => {

  const { equipo_id } = req.params;

  const { error } = await supabase
    .from('suscrito_alumno_poomsae')
    .delete()
    .eq('equipo_id', equipo_id);

  if (error) {
    return res.status(500).json({ ok: false });
  }

  res.json({ ok: true });

});

//Obtener el total de los competidores inscritos en poomsae
router.get('/evento/poomsae/obtenerTotalCompetidores/:id_evento/:categoria/:cinturon', async (req, res) => {
    try {
        const { id_evento, categoria, cinturon } = req.params;

        // Count con Supabase
        const { count, error } = await supabase
            .from('suscrito_alumno_poomsae')
            .select('*', { count: 'exact', head: true })
            .eq('id_evento_fk', id_evento)
            .eq('categoria_suscrito_alumno_poomsae', categoria)
            .eq('cinturon_suscrito_alumno_poomsae', cinturon);

        if (error) {
            console.error('Error Supabase:', error);

            return res.status(500).json({ message: 'Error al obtener el total de competidores' });
        }

        // Siempre devuelve número (aunque sea 0)
        return res.json({
            total_competidores: count || 0
        });

    } catch (err) {
        console.error('Error servidor:', err);

        return res.status(500).json({ message: 'Error interno del servidor'});
    }
});

//Obtener modalidad
router.get('/evento/poomsae/obtenerModalidad/:id_evento_fk', async (req, res) => {
    try {
        const { id_evento_fk } = req.params;

        const { data, error } = await supabase
            .rpc('obtener_modalidades_distintas', {
                p_evento: id_evento_fk
            });

        if (error) {
            console.error('Error RPC modalidades:', error);
            return res.status(500).json({
                message: 'Error al obtener las modalidades',
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
                        WHEN categoria_suscrito_alumno_poomsae = 'JUNIOR' THEN 6
                        WHEN categoria_suscrito_alumno_poomsae = 'SENIOR 1' THEN 7
                        WHEN categoria_suscrito_alumno_poomsae = 'SENIOR 2' THEN 8
                        WHEN categoria_suscrito_alumno_poomsae = 'MASTER 1' THEN 9
                        WHEN categoria_suscrito_alumno_poomsae = 'MASTER 2' THEN 10
                        ELSE 11
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
                        WHEN categoria_suscrito_alumno_poomsae = 'JUNIOR' THEN 6
                        WHEN categoria_suscrito_alumno_poomsae = 'SENIOR 1' THEN 7
                        WHEN categoria_suscrito_alumno_poomsae = 'SENIOR 2' THEN 8
                        WHEN categoria_suscrito_alumno_poomsae = 'MASTER 1' THEN 9
                        WHEN categoria_suscrito_alumno_poomsae = 'MASTER 2' THEN 10
                        ELSE 11
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
        WHEN categoria_suscrito_alumno_poomsae = 'JUNIOR' THEN 6
        WHEN categoria_suscrito_alumno_poomsae = 'SENIOR 1' THEN 7
        WHEN categoria_suscrito_alumno_poomsae = 'SENIOR 2' THEN 8
        WHEN categoria_suscrito_alumno_poomsae = 'MASTER 1' THEN 9
        WHEN categoria_suscrito_alumno_poomsae = 'MASTER 2' THEN 10
        ELSE 11
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