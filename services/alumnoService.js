const dbConnect = require('../db/connect');
const conexion = dbConnect();
function actualizarAlumno(id, id_delegacion_fk, nombre_alumno, apellido_alumno, cedula_alumno, fecha_nacimiento_alumno, edad_alumno, genero_alumno, telefono_alumno, cinturon_alumno, callback) {
    const updateQuery = `
        UPDATE registro_alumno
        SET
            id_delegacion_fk = ?,
            nombre_alumno = ?,
            apellido_alumno = ?,
            cedula_alumno = ?,
            fecha_nacimiento_alumno = ?,
            edad_alumno = ?,
            genero_alumno = ?,
            telefono_alumno = ?,
            cinturon_alumno = ?
        WHERE id_alumno = ?
    `;
    const updateValues = [
        id_delegacion_fk,
        nombre_alumno,
        apellido_alumno,
        cedula_alumno,
        fecha_nacimiento_alumno,
        edad_alumno,
        genero_alumno,
        telefono_alumno,
        cinturon_alumno,
        id
    ];
    conexion.query(updateQuery, updateValues, (error) => {
        if (error) {
            return callback(error, null);
        }
        callback(null, { message: 'Alumno actualizado correctamente.' });
    });
}
module.exports = {
    actualizarAlumno
};