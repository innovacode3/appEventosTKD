const express = require('express');
const dbConnect = require("../db/connect");
const supabase = require('../db/supabaseClient');

const router = express.Router();
const db = dbConnect();

// Obtener todas la llaves creadas 
router.get('/log/administrador/obtenerLlaves/:id_evento_fk', (req, res) => {
  const { id_evento_fk } = req.params;
  const sql = `SELECT * FROM presentacion_llaves WHERE id_evento_fk = $1`;
  db.query(sql, [id_evento_fk], (err, result) => {
      if (err) {
          console.error("Error al obtener las llaves: ", err.message);
          return res.status(500).json({ error: "Error al obtener las llaves" });
      }
      res.json(result.rows);
  });
});

//Agregar una llave creada
router.post('/log/administrador/llavesCreadas/agregar', async (req, res) => {
  const { id_evento_fk, nivel, nombre_categoria, peso_categoria, genero, url_imagen_llaves, total_competidores_llaves } = req.body;

  const categoria = nombre_categoria.replace(/\s+/g, '');
  const nombreImagen = `${id_evento_fk}_${nivel}_${categoria}_${peso_categoria}_${genero}.png`;
  const bufferImagen = Buffer.from(url_imagen_llaves.replace(/^data:image\/png;base64,/, ""), 'base64');

  try {
    // Intentar remover imagen anterior (si existe)
    await supabase.storage.from('llaves-creadas').remove([nombreImagen]).catch(() => {});

    // Subir (crear o sobrescribir) imagen
    const { error: uploadError } = await supabase.storage
      .from('llaves-creadas')
      .upload(nombreImagen, bufferImagen, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Error al subir la imagen a Supabase:', uploadError.message);
      return res.status(500).json({ message: 'Error al subir la imagen a Supabase' });
    }

    // Obtener la URL pública y agregar parámetro anti-cache
    const { data: publicUrlData } = supabase.storage.from('llaves-creadas').getPublicUrl(nombreImagen);
    const imageUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    // Verificar si ya existe registro en la tabla
    const sqlSelect = `
      SELECT * FROM presentacion_llaves 
      WHERE id_evento_fk = $1 AND nivel = $2 AND nombre_categoria = $3 AND peso_categoria = $4 AND genero = $5`;

    db.query(sqlSelect, [id_evento_fk, nivel, nombre_categoria, peso_categoria, genero], (err, result) => {
      if (err) return res.status(500).send('Error al verificar el registro');

      if (result.rows.length > 0) {
        // Actualizar
        const sqlUpdate = `
          UPDATE presentacion_llaves 
          SET url_imagen_llaves = $1, total_competidores_llaves = $2 
          WHERE id_evento_fk = $3 AND nivel = $4 AND nombre_categoria = $5 AND peso_categoria = $6 AND genero = $7`;

        db.query(sqlUpdate, [imageUrl, total_competidores_llaves, id_evento_fk, nivel, nombre_categoria, peso_categoria, genero], (err) => {
          if (err) return res.status(500).send('Error al actualizar los datos');

          res.status(200).send({
            message: 'Llave actualizada correctamente',
            imageUrl
          });
        });
      } else {
        // Insertar
        const sqlInsert = `
          INSERT INTO presentacion_llaves (id_evento_fk, nivel, nombre_categoria, peso_categoria, genero, url_imagen_llaves, total_competidores_llaves)
          VALUES ($1, $2, $3, $4, $5, $6, $7)`;

        db.query(sqlInsert, [id_evento_fk, nivel, nombre_categoria, peso_categoria, genero, imageUrl, total_competidores_llaves], (err) => {
          if (err) return res.status(500).send('Error al insertar los datos');

          res.status(200).send({
            message: 'Llave agregada correctamente',
            imageUrl
          });
        });
      }
    });
  } catch (error) {
    console.error('Error general:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
});

//Obtener las categorias para los resultados de presentacion_llaves
router.get('/evento/combate/llavesCreadas/obtenerCategorias/:id_evento/:genero/:nivel', (req, res) => {
  const {id_evento, genero, nivel} = req.params;
  const sql = `SELECT DISTINCT nombre_categoria FROM presentacion_llaves
               WHERE id_evento_fk = $1 AND genero = $2 AND nivel = $3`;
  db.query(sql, [id_evento, genero, nivel], (err, result) => {
    if (err) {
      console.error("Error al obtener las categorias de las llaves: ", err.message);
      return res.status(500).json({ error: "Error al obtener los datos" });
    }
    //Mostramos un array así sea vacío
    res.json(result.rows);
  })
})

// Obtener los pesos_categorias para los resultados de presentacion_llaves
router.get('/evento/combate/llavesCreadas/obtenerPesosCategorias/:id_evento/:genero/:nivel/:categoria', (req, res) => {
  const {id_evento, genero, nivel, categoria} = req.params;
  const sql = `SELECT DISTINCT peso_categoria FROM presentacion_llaves 
               WHERE id_evento_fk = $1 AND genero = $2 AND nivel = $3 AND nombre_categoria = $4`;
  db.query(sql, [id_evento, genero, nivel, categoria], (err, result) => {
    if (err) {
      console.error("Error al obtener los pesos de las llaves: ", err.message);
      return res.status(500).json({ error: "Error al obtener los datos" });
    }
    //Mostramos un array así sea vacío
    res.json(result.rows);
  })
})

// Obtener nivel y categoria para los filtros
router.get('/evento/combate/llavesCreadas/obtener/nivelesCategorias/:id_evento_fk', (req, res) => {
  const { id_evento_fk } = req.params;

  const sql = `
                SELECT nivel, nombre_categoria
                FROM presentacion_llaves
                WHERE id_evento_fk = $1
                GROUP BY nivel, nombre_categoria
              `;

  db.query(sql, [id_evento_fk], (err, result) => {
    if (err) {
      console.error("Error al obtener niveles y categorías: ", err.message);
      return res.status(500).json({ error: "Error al obtener los datos" });
    }

    // Agrupar resultados por nivel
    const agrupado = {};
    result.rows.forEach(row => {
      const { nivel, nombre_categoria } = row;
      if (!agrupado[nivel]) {
        agrupado[nivel] = [];
      }
      if (!agrupado[nivel].includes(nombre_categoria)) {
        agrupado[nivel].push(nombre_categoria);
      }
    });

    // Convertir a array de objetos
    const respuesta = Object.keys(agrupado).map(niveles => ({
      niveles,
      categorias: agrupado[niveles]
    }));

    res.json(respuesta);
  });
});

// Obtener la lista que se presentará en el usuario para ver las llaves por categoria y nivel
router.get('/evento/combate/llavesCreadas/obtener/nivel/nombre_categoria/llaves/:id_evento_fk/:nivel/:nombre_categoria', (req, res) => {
  const { id_evento_fk, nivel, nombre_categoria } = req.params;
  const sql = `SELECT * FROM presentacion_llaves 
               WHERE id_evento_fk = $1 AND nivel = $2 AND nombre_categoria = $3
              `;
  db.query(sql, [id_evento_fk, nivel, nombre_categoria], (err, result) => {
    if (err) {
      console.error("Error al obtener los datos de las llaves: ", err.message);
      return res.status(500).json({ error: "Error al obtener los datos" });
    }
    //Mostramos un array así sea vacío
    res.json(result.rows);
  });
});


// Eliminar la llave
router.delete('/log/administrador/eliminarLlave/:id', async (req, res) => {
  const { id } = req.params;

  // Consulta para obtener la URL de la imagen
  const sqlSelect = `SELECT url_imagen_llaves FROM presentacion_llaves WHERE idpresentacion_llaves = $1`;

  db.query(sqlSelect, [id], async (err, results) => {
    if (err) {
      console.error('Error al buscar la imagen:', err);
      return res.status(500).send('Error al buscar la imagen');
    }

    if (results.rows.length === 0) {
      return res.status(404).send('No se encontró la imagen solicitada');
    }

    // Obtener la URL de la imagen y extraer el nombre del archivo
    const imageUrl = results.rows[0].url_imagen_llaves;
    const fileNameWithParams = imageUrl.split('/').pop(); // Extraer el nombre del archivo directamente de la URL
    const fileName = fileNameWithParams.split('?')[0];  // limpia el nombre del archivo quitando los parámetros para poder encontrar la imagen

    try {
      // Eliminar la imagen del bucket de Supabase
      const { error: deleteError } = await supabase.storage
        .from('llaves-creadas')
        .remove([fileName]);

      if (deleteError) {
        console.error('Error al eliminar imagen de Supabase:', deleteError.message);
        return res.status(500).send('Error al eliminar la imagen del storage');
      }

      // Eliminar el registro en la base de datos
      const sqlDelete = `DELETE FROM presentacion_llaves WHERE idpresentacion_llaves = $1`;
      db.query(sqlDelete, [id], (err) => {
        if (err) {
          console.error('Error al eliminar los datos de la base de datos:', err);
          return res.status(500).send('Error al eliminar los datos de la base de datos');
        }

        res.status(200).send({ message: 'Llave e imagen eliminadas correctamente' });
      });
    } catch (error) {
      console.error('Error general al eliminar llave:', error);
      res.status(500).send('Error al procesar la eliminación');
    }
  });
});



module.exports = router;