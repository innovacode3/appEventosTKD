const express = require('express');
const router = express.Router();
//Conexion Supabase
const supabase = require('..//db/supabaseClient');

//Obtener alumnos campamento inscritos


//Obtener alumno campamento por id


//Verificar si el alumno campamento esta inscrito por cédula


//Obtener las inscripciones por la cedula


//Inscribir alumnos de campamento


//Editar alumno inscrito campamento


//Eliminar alumno inscrito campamento


//Obtener la lista de alumnos inscritos por evento para admin, public, logueado (ver inscritos)


//Obtener la lista de alumnos inscritos por evento y delegacion para admin, public, logueado (cuando ya está inscrito)


//Obtener las categorias en ese evento ordenados


//Obtener los alumnos inscritos por evento, categoria, genero


module.exports = router;