const express = require('express');
const cors = require("cors");
const bodyParser = require("body-parser");
//const dbConnect = require("./db/connect");
const administradorRoutes = require("./routes/administradorRoutes");
const alumnoInscripcionRoutes = require("./routes/alumnoInscripcionRoutes");
const alumnoRoutes = require("./routes/alumnoRoutes");
const delegacionRoutes = require("./routes/delegacionRoutes");
const eventoRoutes = require("./routes/eventoRoutes");
const llavesRoutes = require("./routes/llavesRoutes");
const presentacionLlavesRoutes = require("./routes/presentacionLlavesRoutes");
const presentacionResultadosRoutes = require("./routes/presentacionResultadosRoutes");
const registroAlumnoRoutes = require("./routes/registroAlumnoRoutes");
const poomsaeInscripcionRoutes = require("./routes/poomsaeInscripcionRoutes");
const poomsaeResultado = require("./routes/poomsaeResultado");
const historialCompetencia = require("./routes/historialCompetenciaRoutes");
require('dotenv').config();

const app = express();
//const port = 5000;

// Configura CORS para permitir tu frontend
/*const corsOptions = {
    origin: 'https://eventoscombate.netlify.app',
    credentials: true // si usas cookies o encabezados de autenticación
};
app.use(cors(corsOptions));*/
app.use(cors());

//Middleware general
app.use(express.json());
app.use(bodyParser.json());
app.use(express.json({ limit: '50mb' })); // Middleware para parsear JSON en el body de las peticiones

//Conectar base de datos
//dbConnect();

//Ruta de las llaves
app.use(administradorRoutes,
        alumnoInscripcionRoutes,
        alumnoRoutes,
        delegacionRoutes,
        eventoRoutes,
        llavesRoutes,
        presentacionLlavesRoutes,
        presentacionResultadosRoutes,
        registroAlumnoRoutes,
        poomsaeInscripcionRoutes,
        poomsaeResultado,
        historialCompetencia
);

// Servir archivos desde la carpeta "uploads"
//app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/*app.listen(port, () => {
    console.log(`Servidor backend corriendo en http://localhost:${port}`);
});*/

//crear la raiz de la API(luego de poner https://app-eventos-tkd.vercel.app, muestra 'API backendCombate funcionando correctamente' lo que indica que esta funcionando bien el servidor)
app.get('/',(req,res) => {
    res.send('API backendCombate funcionando correctamente');
})

// Exporta como función para Vercel
module.exports = app;

