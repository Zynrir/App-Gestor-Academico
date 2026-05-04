const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 1. IMPORTAR TODAS LAS RUTAS
const asignaturasRoutes = require('./routes/asignaturas');
const tareasRoutes = require('./routes/tareas');
const calculoRoutes = require('./routes/calculo');
const calificacionesRoutes = require('./routes/calificaciones');
const estructuraRoutes = require('./routes/estructura');
const examenesRoutes = require('./routes/examenes'); 
const practicasRoutes = require('./routes/practicas');

// 2. INICIALIZAR LA APP
const app = express();
const PORT = process.env.PORT || 3000;

// 3. MIDDLEWARE
app.use(cors());
app.use(express.json());

// 4. USAR LAS RUTAS
app.use('/api/asignaturas', asignaturasRoutes);
app.use('/api/tareas', tareasRoutes);
app.use('/api/calculo', calculoRoutes);
app.use('/api/calificaciones', calificacionesRoutes);
app.use('/api/estructura', estructuraRoutes);
app.use('/api/examenes', examenesRoutes);
app.use('/api/practicas', practicasRoutes);

// Ruta base de salud
app.get('/', (req, res) => {
    res.send('API Instituto Full Stack funcionando 🚀');
});

// 5. ARRANCAR SERVIDOR
app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});