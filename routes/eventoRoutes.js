const express = require('express');
const dbConnect = require('../db/connect');
const supabase = require('../db/supabaseClient');
const sharp = require('sharp'); // Necesario para convertir el buffer
const multer = require('multer');
const upload = multer(); // Usamos memoria (sin archivos físicos)
const router = express.Router();

const db = dbConnect();
//listar todos los eventos logueado modo administrador
router.get('/log/administrador/evento/lista', async (req, res) => {
    try {

        const { data, error } = await supabase
            .from('evento')
            .select('*')
            .order('fecha_evento', { ascending: false }); // false = más recientes primero

        if (error) {
            console.error('Error al obtener eventos:', error);
            return res.status(500).json({
                error: 'Error al obtener los datos'
            });
        }

        // Siempre devuelve array (aunque esté vacío)
        res.json(data);

    } catch (err) {
        console.error('Error general:', err);
        res.status(500).json({
            error: err.message || err
        });
    }
});

//listar todos los eventos modo publico
router.get('/public/evento/lista', async (req, res) => {
    try {

        const { data, error } = await supabase
            .from('evento')
            .select('*')
            .eq('estado_evento', 'Visible') // Solo visibles
            .order('fecha_evento', { ascending: false }); // Más recientes primero

        if (error) {
            console.error('Error al obtener eventos públicos:', error);
            return res.status(500).json({
                error: 'Error al obtener los datos'
            });
        }

        // Siempre devuelve un array
        res.json(data);

    } catch (err) {
        console.error('Error general:', err);
        res.status(500).json({
            error: err.message || err
        });
    }
});

//logueado obtener evento por ID en mod delegacion (esto al momento de registrarse en un evento a los alumnos, el id del evento pasa a ser fk)
router.get('/log/delegacion/evento/registro/:id', async (req, res) => {
    const { id } = req.params;

    try {

        const { data, error } = await supabase
            .from('evento')
            .select('*')
            .eq('id_evento', id)
            .single(); // Porque es solo 1 evento

        if (error) {

            // Si no encuentra el registro
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    message: 'Evento no encontrado'
                });
            }

            console.error('Error al obtener evento:', error);
            return res.status(500).json({
                error: 'Error al obtener los datos'
            });
        }

        // Devuelve un solo objeto
        res.json(data);

    } catch (err) {

        console.error('Error general:', err);

        res.status(500).json({
            error: err.message || err
        });
    }
});

//publico obtener evento por ID
//verificar si estoy usando esta ruta
router.get('/public/evento/:id', async (req, res) => {
    const { id } = req.params;

    try {

        const { data, error } = await supabase
            .from('evento')
            .select('*')
            .eq('id_evento', id)
            .eq('estado_evento', 'Visible') // Solo eventos visibles
            .single();

        if (error) {

            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    message: 'Evento no encontrado'
                });
            }

            console.error('Error al obtener evento:', error);

            return res.status(500).json({
                error: 'Error al obtener los datos'
            });
        }

        res.json(data);

    } catch (err) {

        console.error('Error general:', err);

        res.status(500).json({
            error: err.message || err
        });
    }
});

//agregar evento
router.post('/log/administrador/evento/agregar', upload.single('imagenEvento'), async (req, res) => {
    try {
        if (!req.file) {
            console.log('No se ha proporcionado ninguna imagen');
            return res.status(400).json({ message: 'No se ha proporcionado ninguna imagen.' });
        }

        const imagenNombreEvento = req.file.originalname;

        const { data: existente, error: existingError } = await supabase
            .storage
            .from('imagenes-eventos')
            .list('', { search: imagenNombreEvento });

        if (existingError) {
            console.error('Error al verificar existencia de imagen:', existingError.message);
            return res.status(500).json({ message: 'Error al verificar la existencia de la imagen en Supabase.' });
        }

        if (existente.length > 0) {
            console.log('La imagen ya existe en Supabase');
            return res.status(400).json({ message: 'Esta imagen ya está registrada en la base de datos. Por favor, cargue una imagen con otro nombre.' });
        }

        const buffer = await sharp(req.file.buffer).toBuffer();
        const { error: uploadError } = await supabase
            .storage
            .from('imagenes-eventos')
            .upload(imagenNombreEvento, buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (uploadError) {
            console.error('Error al subir la imagen a Supabase:', uploadError.message);
            return res.status(500).json({ message: 'Error al subir la imagen a Supabase.' });
        }

        const urlPublica = `${process.env.SUPABASE_URL}/storage/v1/object/public/imagenes-eventos/${imagenNombreEvento}`;

        // Asegurarse de que se reciba como array desde el frontend
        let modalidadesEvento;
        try {
            modalidadesEvento = typeof req.body.modalidad_evento === 'string'
                ? JSON.parse(req.body.modalidad_evento)
                : req.body.modalidad_evento;

            if (!Array.isArray(modalidadesEvento)) {
                modalidadesEvento = [modalidadesEvento];
            }
        } catch (e) {
            modalidadesEvento = [];
        }

        // Asegurarse de que se reciba como array desde el frontend
        let categoriasEvento;
        try {
            categoriasEvento = typeof req.body.categorias_evento === 'string'
                ? JSON.parse(req.body.categorias_evento)
                : req.body.categorias_evento;

            if (!Array.isArray(categoriasEvento)) {
                categoriasEvento = [categoriasEvento];
            }
        } catch (e) {
            categoriasEvento = [];
        }

        // Asegurarse de que se reciba como array desde el frontend
        let nivelesEvento;
        try {
            nivelesEvento = typeof req.body.nivel_evento === 'string'
                ? JSON.parse(req.body.nivel_evento)
                : req.body.nivel_evento;
            
            if (!Array.isArray(nivelesEvento)) {
                nivelesEvento = [nivelesEvento];
            }
        } catch (e) {
            nivelesEvento = [];
        }

        const {
            titulo_evento,
            url_reglamento_evento,
            fecha_limite_inscripcion_evento,
            estado_evento,
            direccion_evento,
            ubicacion_evento,
            fecha_evento,
            modalidad_evento,
            categorias_evento,
            nivel_evento,
            deporte_evento,
            puntaje_1,
            puntaje_2,
            puntaje_3
        } = req.body;

        if (!titulo_evento || !url_reglamento_evento || !fecha_limite_inscripcion_evento || !estado_evento || !direccion_evento || !ubicacion_evento || !fecha_evento || !modalidad_evento
            || !categorias_evento || !nivel_evento || !deporte_evento || !puntaje_1 || !puntaje_2 || !puntaje_3) {
            return res.status(400).json({ message: 'Datos inválidos' });
        }

        const { data, error } = await supabase
            .from('evento')
            .insert([{
                titulo_evento,
                url_imagen_evento: urlPublica,
                nombre_imagen_evento: imagenNombreEvento,
                url_reglamento_evento,
                fecha_limite_inscripcion_evento,
                estado_evento,
                direccion_evento,
                ubicacion_evento,
                fecha_evento,
                modalidad_evento: modalidadesEvento,
                categorias_evento: categoriasEvento,
                nivel_evento: nivelesEvento,
                deporte_evento,
                puntaje_1,
                puntaje_2,
                puntaje_3
            }])
            .select()
            .single();
        
        if (error) return res.status(400).json(error)
        res.json(data)

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al crear el evento' });
    }
});


// editar evento
router.put('/log/administrador/evento/editar/:id', upload.single('imagenEvento'), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            titulo_evento,
            url_reglamento_evento,
            fecha_limite_inscripcion_evento,
            estado_evento,
            direccion_evento,
            ubicacion_evento,
            fecha_evento,
            modalidad_evento,
            categorias_evento, // <- Añadido aquí
            nivel_evento,
            deporte_evento,
            puntaje_1,
            puntaje_2,
            puntaje_3
        } = req.body;

        if (!titulo_evento || !url_reglamento_evento || !fecha_limite_inscripcion_evento || !estado_evento || !direccion_evento || !ubicacion_evento || !fecha_evento || !modalidad_evento
            || !categorias_evento || !nivel_evento || !deporte_evento || puntaje_1 === undefined || puntaje_2 === undefined || puntaje_3 === undefined) {
            return res.status(400).json({ message: 'Datos inválidos' });
        }

        //obtener evento actual
        const { data, error } = await supabase.from('evento').select('*').eq('id_evento', id).single();

        if (error || !data) {
            return res.status(400).json({ error: 'El evento no existe' });
        }

        const oldImageUrl = data.url_imagen_evento;
        const oldImageName = data.nombre_imagen_evento;

        let nuevaUrl = oldImageUrl;
        let nuevoNombreImagen = oldImageName;

        if (req.file) {
            const imagenNombreEvento = req.file.originalname;

            const { data: existente } = await supabase
                .storage
                .from('imagenes-eventos')
                .list('', { search: imagenNombreEvento });

            if (existente.length > 0) {
                return res.status(400).json({ message: 'Esta imagen ya está registrada en la base de datos. Por favor, cargue una imagen con otro nombre.' });
            }

            const buffer = await sharp(req.file.buffer).toBuffer();
            const { error: uploadError } = await supabase
                .storage
                .from('imagenes-eventos')
                .upload(imagenNombreEvento, buffer, {
                    contentType: req.file.mimetype,
                    upsert: false
                });

            if (uploadError) {
                console.error('Error al subir la imagen a Supabase:', uploadError);
                return res.status(500).json({ message: 'Error al subir la imagen a Supabase' });
            }

            nuevaUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/imagenes-eventos/${imagenNombreEvento}`;
            nuevoNombreImagen = imagenNombreEvento;

            if (oldImageName) {
                await supabase
                    .storage
                    .from('imagenes-eventos')
                    .remove([oldImageName]);
            }
        }

        // Convertir modalidades a array (si vienen como string) y luego a JSON
        let modalidadesArray = [];
        try {
            modalidadesArray = Array.isArray(modalidad_evento)
                ? modalidad_evento
                : JSON.parse(modalidad_evento || '[]');
        } catch (e) {
            console.error('Error al parsear modalidad_evento:', e);
            return res.status(400).json({ message: 'Formato inválido para modalidades' });
        }

        // Convertir categorías a array (si vienen como string) y luego a JSON
        let categoriasArray = [];
        try {
            categoriasArray = Array.isArray(categorias_evento)
                ? categorias_evento
                : JSON.parse(categorias_evento || '[]');
        } catch (e) {
            console.error('Error al parsear categorias_evento:', e);
            return res.status(400).json({ message: 'Formato inválido para categorías' });
        }

        // Convertir niveles a array (si vienen como string) y luego a JSON
        let nivelesArray = [];
        try {
            nivelesArray = Array.isArray(nivel_evento)
                ? nivel_evento
                : JSON.parse(nivel_evento || '[]');
        } catch (e) {
            console.error('Error al parsear niveles_evento:', e);
            return res.status(400).json({ message: 'Formato inválido para niveles' });
        }

        const { data: eventoActualizado, error: errUpdate } = await supabase
            .from('evento')
            .update({
                titulo_evento,
                url_imagen_evento: nuevaUrl,
                nombre_imagen_evento: nuevoNombreImagen,
                url_reglamento_evento,
                fecha_limite_inscripcion_evento,
                estado_evento,
                direccion_evento,
                ubicacion_evento,
                fecha_evento,
                modalidad_evento: modalidadesArray,
                categorias_evento: categoriasArray,
                nivel_evento: nivelesArray,
                deporte_evento,
                puntaje_1,
                puntaje_2,
                puntaje_3
            })
            .eq('id_evento', id)
            .select()
            .single();
        
        if (errUpdate) return res.status(400).json(errUpdate);

        return res.json({
            message: 'Evento actualizado correctamente',
            evento: eventoActualizado
        });

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Error al actualizar el evento' });
    }
});


//eliminar evento
router.delete('/log/evento/borrar/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Validar ID
        if (!id || isNaN(id)) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        // Obtener imagen
        const { data: evento, error: getError } = await supabase
            .from('evento')
            .select('nombre_imagen_evento')
            .eq('id_evento', id)
            .single();

        if (getError || !evento) {
            return res.status(404).json({ message: 'Evento no encontrado' });
        }

        const nombreImagen = evento.nombre_imagen_evento;

        // Eliminar relaciones
        const tablas = [
            'suscrito_alumno_evento',
            'suscrito_alumno_poomsae',
            'llaves_competidor_resultado',
            'poomsae_resultado',
            'presentacion_llaves'
        ];

        for (const tabla of tablas) {
            const { error } = await supabase
                .from(tabla)
                .delete()
                .eq('id_evento_fk', id);

            if (error) {
                throw new Error(`Error eliminando en ${tabla}`);
            }
        }

        // Eliminar evento
        const { error: deleteEventoError } = await supabase
            .from('evento')
            .delete()
            .eq('id_evento', id);

        if (deleteEventoError) {
            throw deleteEventoError;
        }

        // Eliminar imagen
        const { error: deleteImgError } = await supabase
            .storage
            .from('imagenes-eventos')
            .remove([nombreImagen]);

        if (deleteImgError) {
            throw deleteImgError;
        }

        res.json({ message: 'Evento eliminado correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar el evento' });
    }
});


//obtener delegaciones registradas a un evento
router.get('/evento/lista_delegaciones/:id_evento', (req, res) => {
    const { id_evento } = req.params;
    const query = `
        SELECT DISTINCT rd.id_delegacion, rd.nombre_delegacion, rd.nombre_corto_delegacion
        FROM (
            SELECT id_delegacion_fk
            FROM suscrito_alumno_evento
            WHERE id_evento_fk = $1

            UNION

            SELECT id_delegacion_fk
            FROM suscrito_alumno_poomsae
            WHERE id_evento_fk = $1
        ) AS delegaciones
        INNER JOIN registro_delegacion rd ON rd.id_delegacion = delegaciones.id_delegacion_fk
        ORDER BY rd.nombre_delegacion ASC`;
    db.query(query, [id_evento], (error, resultado) => {
        if (error) {
            console.log(error.message);
            return res.status(500).json({ message: "Error en la consulta" });
        }
        //Siempre arroja un array vacío si no hay nada
        res.json(resultado.rows);
    });
});

//obtener la lista de alumnos inscritos a un evento en base a al id_delegacion
router.get('/evento/delegacion/lista_alumnos_inscritos/:id_evento_fk/:id_delegacion_fk', (req, res) => {
    const { id_evento_fk, id_delegacion_fk } = req.params;
    const query = `
        SELECT r.cedula_suscrito_alumno_evento, r.nombres_suscrito_alumno_evento, r.apellidos_suscrito_alumno_evento, 
               r.nivel_suscrito_alumno_evento, r.nombre_categoria_alumno_evento, r.peso_suscrito_alumno_evento, 
               r.peso_categoria_suscrito_alumno_evento, r.genero_suscrito_alumno_evento, r.edad_suscrito_alumno_evento, r.fnacimiento_suscrito_alumno_evento, d.nombre_delegacion  
        FROM suscrito_alumno_evento r
        JOIN registro_delegacion d ON r.id_delegacion_fk = d.id_delegacion 
        WHERE r.id_evento_fk = $1 AND r.id_delegacion_fk = $2
        ORDER BY
            d.nombre_delegacion ASC
            `;
    db.query(query, [id_evento_fk, id_delegacion_fk], (error, resultado) => {
        if (error) {
            console.log(error.message);
            return res.status(500).json({ message: "Error en la consulta" });
        }
        //Siempre arroja un array, así este vacío
        res.json(resultado.rows);
    });
});

//listar todos los alumnos que estan suscritos a un evento
router.get('/log/administrador/evento/lista_alumnos_combate/:id_evento_fk', (req, res) => {
    const { id_evento_fk } = req.params;
    const query = `
        SELECT sae.id_suscrito_alumno_evento,
               sae.cedula_suscrito_alumno_evento, sae.nombres_suscrito_alumno_evento, sae.id_evento_fk, sae.id_delegacion_fk,
               sae.apellidos_suscrito_alumno_evento, sae.edad_suscrito_alumno_evento, sae.nombre_categoria_alumno_evento, 
               sae.genero_suscrito_alumno_evento, sae.cinturon_suscrito_alumno_evento, sae.peso_suscrito_alumno_evento, 
               sae.peso_categoria_suscrito_alumno_evento, sae.nivel_suscrito_alumno_evento, sae.fnacimiento_suscrito_alumno_evento, rd.nombre_delegacion
        FROM suscrito_alumno_evento sae
        INNER JOIN registro_delegacion rd ON sae.id_delegacion_fk = rd.id_delegacion
        WHERE sae.id_evento_fk = $1
        ORDER BY
            rd.nombre_delegacion ASC`;
    db.query(query, [id_evento_fk], (error, resultado) => {
        if (error) {
            console.log(error.message);
            return res.status(500).json({ message: "Error en la consulta" });
        }
        //Siempre muestra un array así esté vacío
        res.json(resultado.rows);
    });
});

//Eliminar modo administrador un alumno inscrito a un evento
router.delete('/log/administrador/evento/lista_alumnos_combate/eliminarCombate/:id', (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM suscrito_alumno_evento WHERE id_suscrito_alumno_evento = $1`;  
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Error al eliminar los datos' });
        }
        res.json('Se eliminó correctamente el alumno inscrito');
    });
})

//listar todos los alumnos que estan suscritos a un evento modo poomsae
router.get('/log/administrador/evento/lista_alumnos_poomsae/:id_evento_fk', (req, res) => {
    const { id_evento_fk } = req.params;
    const query = `
        SELECT sap.id_suscrito_alumno_poomsae,
               sap.cedula_suscrito_alumno_poomsae, 
               sap.nombres_suscrito_alumno_poomsae, 
               sap.apellidos_suscrito_alumno_poomsae, 
               sap.edad_suscrito_alumno_poomsae, 
               sap.categoria_suscrito_alumno_poomsae, 
               sap.genero_suscrito_alumno_poomsae, 
               sap.cinturon_suscrito_alumno_poomsae, 
               rd.nombre_delegacion
        FROM suscrito_alumno_poomsae sap
        INNER JOIN registro_delegacion rd ON sap.id_delegacion_fk = rd.id_delegacion
        WHERE sap.id_evento_fk = $1
        ORDER BY 
            CASE
                WHEN sap.categoria_suscrito_alumno_poomsae = 'PRE INFANTIL 1' THEN 1
                WHEN sap.categoria_suscrito_alumno_poomsae = 'PRE INFANTIL 2' THEN 2
                WHEN sap.categoria_suscrito_alumno_poomsae = 'INFANTIL A' THEN 3
                WHEN sap.categoria_suscrito_alumno_poomsae = 'INFANTIL B' THEN 4
                WHEN sap.categoria_suscrito_alumno_poomsae = 'CADETES' THEN 5
                WHEN sap.categoria_suscrito_alumno_poomsae = 'JUNIOR' THEN 6
                WHEN sap.categoria_suscrito_alumno_poomsae = 'SENIOR 1' THEN 7
                WHEN sap.categoria_suscrito_alumno_poomsae = 'SENIOR 2' THEN 8
                WHEN sap.categoria_suscrito_alumno_poomsae = 'MASTER 1' THEN 9
                WHEN sap.categoria_suscrito_alumno_poomsae = 'MASTER 2' THEN 10
                ELSE 11
            END,
            CASE
                WHEN sap.genero_suscrito_alumno_poomsae = 'Masculino' THEN 1
                WHEN sap.genero_suscrito_alumno_poomsae = 'Femenino' THEN 2
                ELSE 3
            END,
            CASE
                WHEN sap.cinturon_suscrito_alumno_poomsae = 'Blanco' THEN 1
                WHEN sap.cinturon_suscrito_alumno_poomsae = 'Blanco-Amarillo' THEN 2
                WHEN sap.cinturon_suscrito_alumno_poomsae = 'Amarillo' THEN 3
                WHEN sap.cinturon_suscrito_alumno_poomsae = 'Amarillo-Verde' THEN 4
                WHEN sap.cinturon_suscrito_alumno_poomsae = 'Verde' THEN 5
                WHEN sap.cinturon_suscrito_alumno_poomsae = 'Verde-Azul' THEN 6
                WHEN sap.cinturon_suscrito_alumno_poomsae = 'Azul' THEN 7
                WHEN sap.cinturon_suscrito_alumno_poomsae = 'Azul-Rojo' THEN 8
                WHEN sap.cinturon_suscrito_alumno_poomsae = 'Rojo' THEN 9
                WHEN sap.cinturon_suscrito_alumno_poomsae = 'Rojo-Negro' THEN 10
                WHEN sap.cinturon_suscrito_alumno_poomsae = 'Negro' THEN 10
            END,
            rd.nombre_delegacion ASC;`;
    db.query(query, [id_evento_fk], (error, resultado) => {
        if (error) {
            console.log(error.message);
            return res.status(500).json({ message: "Error en la consulta" });
        }
        //Siempre muestra un array así esté vacío
        res.json(resultado.rows);
    });
});

//obtener la lista de alumnos inscritos a un evento modo poomsae en base al id_delegacion modo publico
router.get('/evento/delegacion/lista_alumnos_inscritos_poomsae/:id_evento_fk/:id_delegacion_fk', (req, res) => {
    const { id_evento_fk, id_delegacion_fk } = req.params;
    const query = `
        SELECT r.cedula_suscrito_alumno_poomsae, 
               r.nombres_suscrito_alumno_poomsae, 
               r.apellidos_suscrito_alumno_poomsae, 
               r.edad_suscrito_alumno_poomsae, 
               r.categoria_suscrito_alumno_poomsae, 
               r.genero_suscrito_alumno_poomsae, 
               r.cinturon_suscrito_alumno_poomsae,
               d.nombre_delegacion
        FROM suscrito_alumno_poomsae r
        JOIN registro_delegacion d ON r.id_delegacion_fk = d.id_delegacion
        WHERE r.id_evento_fk = $1 AND id_delegacion_fk = $2
        ORDER BY 
            CASE
                WHEN r.categoria_suscrito_alumno_poomsae = 'PRE INFANTIL' THEN 1
                WHEN r.categoria_suscrito_alumno_poomsae = 'PRE CADETES A' THEN 2
                WHEN r.categoria_suscrito_alumno_poomsae = 'PRE CADETES B' THEN 3
                WHEN r.categoria_suscrito_alumno_poomsae = 'PRE CADETES C' THEN 4
                WHEN r.categoria_suscrito_alumno_poomsae = 'CADETES' THEN 5
                WHEN r.categoria_suscrito_alumno_poomsae = 'PREJUVENIL' THEN 6
                WHEN r.categoria_suscrito_alumno_poomsae = 'JUVENIL U22' THEN 7
                WHEN r.categoria_suscrito_alumno_poomsae = 'SENIOR' THEN 8
                ELSE 9
            END,
            CASE
                WHEN r.genero_suscrito_alumno_poomsae = 'Masculino' THEN 1
                WHEN r.genero_suscrito_alumno_poomsae = 'Femenino' THEN 2
                ELSE 3
            END,
            CASE
                WHEN r.cinturon_suscrito_alumno_poomsae = 'Blanco' THEN 1
                WHEN r.cinturon_suscrito_alumno_poomsae = 'Blanco-Amarillo' THEN 2
                WHEN r.cinturon_suscrito_alumno_poomsae = 'Amarillo' THEN 3
                WHEN r.cinturon_suscrito_alumno_poomsae = 'Amarillo-Verde' THEN 4
                WHEN r.cinturon_suscrito_alumno_poomsae = 'Verde' THEN 5
                WHEN r.cinturon_suscrito_alumno_poomsae = 'Verde-Azul' THEN 6
                WHEN r.cinturon_suscrito_alumno_poomsae = 'Azul' THEN 7
                WHEN r.cinturon_suscrito_alumno_poomsae = 'Azul-Rojo' THEN 8
                WHEN r.cinturon_suscrito_alumno_poomsae = 'Rojo' THEN 9
                WHEN r.cinturon_suscrito_alumno_poomsae = 'Rojo-Negro' THEN 10
                WHEN r.cinturon_suscrito_alumno_poomsae = 'Negro' THEN 10
            END`;
    db.query(query, [id_evento_fk, id_delegacion_fk], (error, resultado) => {
        if (error) {
            console.log(error.message);
            return res.status(500).json({ message: "Error en la consulta" });
        }
        //Siempre muestra un array así esté vacío
        res.json(resultado.rows);
    });
});

//Eliminar modo administrador un inscrito en poomsae
router.delete('/log/administrador/evento/lista_alumnos_poomsae/eliminarPoomsae/:id', (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM suscrito_alumno_poomsae WHERE id_suscrito_alumno_poomsae = $1`;  
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Error al eliminar los datos' });
        }
        res.json('Se eliminó correctamente el alumno inscrito');
    });
})

// suma total de puntos por delegacion en un evento
router.get('/evento/resultadosGeneral/:id_evento_fk', (req, res) => {
    const {id_evento_fk} = req.params;
    const query = `SELECT 
                        delegacion,
                        deportistas,
                        total_puntos,
                        CASE ranking
                            WHEN 1 THEN '1° 🥇'  
                            WHEN 2 THEN '2° 🥈' 
                            WHEN 3 THEN '3° 🥉'  
                            WHEN 4 THEN '4°'
                            WHEN 5 THEN '5°'
                            WHEN 6 THEN '6°' 
                            WHEN 7 THEN '7°' 
                            WHEN 8 THEN '8°' 
                            WHEN 9 THEN '9°' 
                            WHEN 10 THEN '10°'
                            WHEN 11 THEN '11°' 
                            WHEN 12 THEN '12°' 
                            WHEN 13 THEN '13°' 
                            WHEN 14 THEN '14°' 
                            WHEN 15 THEN '15°' 
                            WHEN 16 THEN '16°' 
                            WHEN 17 THEN '17°' 
                            WHEN 18 THEN '18°' 
                            WHEN 19 THEN '19°'
                            WHEN 20 THEN '20°'
                            WHEN 21 THEN '21°' 
                            WHEN 22 THEN '22°' 
                            WHEN 23 THEN '23°' 
                            WHEN 24 THEN '24°' 
                            WHEN 25 THEN '25°' 
                            WHEN 26 THEN '26°' 
                            WHEN 27 THEN '27°' 
                            WHEN 28 THEN '28°' 
                            WHEN 29 THEN '29°' 
                            WHEN 30 THEN '30°'      
                            ELSE '-'
                        END AS ubicacion
                    FROM (
                        SELECT 
                            delegacion, 
                            SUM(total_puntaje) AS total_puntos,
                            SUM(num_deportistas) AS deportistas,
                            SUM(medallas_oro) AS medallas_oro,
                            SUM(medallas_plata) AS medallas_plata,
                            SUM(medallas_bronce) AS medallas_bronce,
                            DENSE_RANK() OVER (
                                ORDER BY 
                                    SUM(total_puntaje) DESC, 
                                    SUM(medallas_oro) DESC, 
                                    SUM(medallas_plata) DESC, 
                                    SUM(medallas_bronce) DESC
                            ) AS ranking
                        FROM (
                            SELECT 
                                poomsae_nombre_delegacion AS delegacion, 
                                SUM(puntaje) AS total_puntaje,
                                SUM(CASE 
                                    WHEN resultado IN ('MEDALLA DE ORO', 'MEDALLA DE PLATA', 'MEDALLA DE BRONCE') AND puntaje > 0 
                                    THEN 1 ELSE 0 END) AS num_deportistas,
                                SUM(CASE WHEN resultado = 'MEDALLA DE ORO' THEN 1 ELSE 0 END) AS medallas_oro,
                                SUM(CASE WHEN resultado = 'MEDALLA DE PLATA' THEN 1 ELSE 0 END) AS medallas_plata,
                                SUM(CASE WHEN resultado = 'MEDALLA DE BRONCE' THEN 1 ELSE 0 END) AS medallas_bronce
                            FROM 
                                poomsae_resultado
                            WHERE id_evento_fk = $1
                            GROUP BY 
                                poomsae_nombre_delegacion

                            UNION ALL

                            SELECT 
                                nombre_delegacion AS delegacion, 
                                SUM(puntaje) AS total_puntaje,
                                SUM(CASE 
                                    WHEN resultado IN ('MEDALLA DE ORO', 'MEDALLA DE PLATA', 'MEDALLA DE BRONCE') AND puntaje > 0 
                                    THEN 1 ELSE 0 END) AS num_deportistas,
                                SUM(CASE WHEN resultado = 'MEDALLA DE ORO' THEN 1 ELSE 0 END) AS medallas_oro,
                                SUM(CASE WHEN resultado = 'MEDALLA DE PLATA' THEN 1 ELSE 0 END) AS medallas_plata,
                                SUM(CASE WHEN resultado = 'MEDALLA DE BRONCE' THEN 1 ELSE 0 END) AS medallas_bronce
                            FROM 
                                llaves_competidor_resultado
                            WHERE id_evento_fk = $1
                            GROUP BY 
                                nombre_delegacion
                        ) AS totales_por_tabla
                        GROUP BY 
                            delegacion
                    ) AS resultados_con_ranking
                    ORDER BY 
                        total_puntos DESC, 
                        medallas_oro DESC, 
                        medallas_plata DESC, 
                        medallas_bronce DESC;
                    `;
    db.query(query, [id_evento_fk],(error, resultado) => {
        if (error) return console.log(error.message);
        if (resultado.rows.length > 0) {
            res.json(resultado.rows);
        } else {
            res.json('No hay registros');
        }
    });
});

//obtener el total de los 3 tipos de melladas por nombre_delegacion de tabla para poomase 
router.get('/public/evento_poomsae/:id_evento_fk/:delegacion', (req, res) => {
    const { id_evento_fk, delegacion } = req.params;
    const query = `SELECT
                        poomsae_nombre_delegacion AS delegacion,
                        COUNT(CASE WHEN resultado = 'MEDALLA DE ORO' AND puntaje > 0 THEN 1 END) AS oro,
                        COUNT(CASE WHEN resultado = 'MEDALLA DE PLATA' AND puntaje > 0 THEN 1 END) AS plata,
                        COUNT(CASE WHEN resultado = 'MEDALLA DE BRONCE' AND puntaje > 0 THEN 1 END) AS bronce
                    FROM
                        poomsae_resultado
                    WHERE
                        id_evento_fk = $1 AND 
                        REPLACE(LOWER(TRIM(poomsae_nombre_delegacion)), ' ', '') = REPLACE(LOWER($2), ' ', '')
                    GROUP BY
                        poomsae_nombre_delegacion;`;
    db.query(query, [id_evento_fk, delegacion], (error, resultado) => {
        if (error) return console.log(error.message);
        if (resultado.rows.length > 0) {
            res.json(resultado.rows);
        } else {
            res.json('No se han encontrado registros');
        }
    });
});

//obtener el total de los 3 tipos de melladas por nombre_delegacion tabla  para combate
router.get('/public/evento_combate/:id_evento_fk/:delegacion', (req, res) => {
    const { id_evento_fk, delegacion } = req.params;

    const query = `
        SELECT
            nombre_delegacion AS delegacion,
            COUNT(CASE WHEN resultado = 'MEDALLA DE ORO' AND puntaje > 0 THEN 1 END) AS oro,
            COUNT(CASE WHEN resultado = 'MEDALLA DE PLATA' AND puntaje > 0 THEN 1 END) AS plata,
            COUNT(CASE WHEN resultado = 'MEDALLA DE BRONCE' AND puntaje > 0 THEN 1 END) AS bronce
        FROM
            llaves_competidor_resultado
        WHERE
            id_evento_fk = $1 AND
            REPLACE(LOWER(TRIM(nombre_delegacion)), ' ', '') = REPLACE(LOWER($2), ' ', '')
        GROUP BY
            nombre_delegacion
    `;

    db.query(query, [id_evento_fk, delegacion], (error, resultado) => {
        if (error) {
            console.error(error.message);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        if (resultado.rows.length > 0) {
            res.json(resultado.rows);
        } else {
            res.status(404).json({ message: 'No se han encontrado registros' });
        }
    });
});


module.exports = router;