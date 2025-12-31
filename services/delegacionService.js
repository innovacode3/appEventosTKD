const dbConnect = require('../db/connect');
const conexion = dbConnect();
function actualizarDelegacion(id, nombre_delegacion, telefono_representante_delegacion, provincia_delegacion, canton_delegacion, nombre_representante_delegacion, cedula_representante_delegacion, correo_representante_delegacion, callback) {
    const updateQuery = `
        UPDATE registro_delegacion
        SET
            nombre_delegacion = ?,
            telefono_representante_delegacion = ?,
            provincia_delegacion = ?,
            canton_delegacion = ?,
            nombre_representante_delegacion = ?,
            cedula_representante_delegacion = ?,
            correo_representante_delegacion = ?
        WHERE id_delegacion = ?
    `;
    const updateValues = [
        nombre_delegacion,
        telefono_representante_delegacion,
        provincia_delegacion,
        canton_delegacion,
        nombre_representante_delegacion,
        cedula_representante_delegacion,
        correo_representante_delegacion,
        id
    ];
    conexion.query(updateQuery, updateValues, (error) => {
        if (error) {
            return callback(error, null);
        }
        callback(null, { message: 'Delegación actualizada correctamente.' });
    });
}
module.exports = {
    actualizarDelegacion
};