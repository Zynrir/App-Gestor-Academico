const express = require('express');
const router = express.Router();
const db = require('../db');

// GET: Obtener las asignaturas del usuario con su nota media
router.get('/usuario/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const asigQuery = 'SELECT * FROM Asignaturas WHERE id_usuario = $1 ORDER BY id_asignatura ASC';
        const { rows: asignaturas } = await db.query(asigQuery, [id]);

        const asignaturasConNota = await Promise.all(asignaturas.map(async (asig) => {
            const resRA = await db.query(
                'SELECT id_ra, peso_porcentual FROM Resultados_Aprendizaje WHERE id_asignatura = $1',
                [asig.id_asignatura]
            );
            const ras = resRA.rows;

            let notaFinal = 0;
            let pesoTotalCalculado = 0;

            for (let ra of ras) {
                const queryMediaRA = `
                    SELECT AVG(cal.nota_obtenida / ca.puntuacion_maxima * 10) as media_criterios
                    FROM Criterios_Evaluacion ce
                    JOIN Criterios_Actividad ca ON ce.id_criterio = ca.id_criterio
                    JOIN Calificaciones cal ON ca.id_criterio_actividad = cal.id_criterio_actividad
                    WHERE ce.id_ra = $1
                `;
                const resMedia = await db.query(queryMediaRA, [ra.id_ra]);
                const mediaRA = parseFloat(resMedia.rows[0].media_criterios || 0);

                if (resMedia.rows[0].media_criterios !== null) {
                    notaFinal += mediaRA * parseFloat(ra.peso_porcentual);
                    pesoTotalCalculado += parseFloat(ra.peso_porcentual);
                }
            }

            asig.nota_media = pesoTotalCalculado > 0 ? notaFinal.toFixed(2) : null;
            return asig;
        }));

        res.json(asignaturasConNota);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener asignaturas' });
    }
});

// POST: Crear asignatura
router.post('/', async (req, res) => {
    const { nombre, curso_academico, color_identificacion, id_usuario } = req.body;
    try {
        const query = `
            INSERT INTO Asignaturas (nombre, curso_academico, color_identificacion, id_usuario) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *
        `;
        const result = await db.query(query, [nombre, curso_academico, color_identificacion, id_usuario]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error en POST /asignaturas:", err);
        res.status(500).json({ error: 'Error al crear la asignatura' });
    }
});

// --- NUEVA RUTA: ELIMINAR ASIGNATURA ---
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Ejecutamos el borrado. Si en la DB definiste las tablas con "ON DELETE CASCADE",
        // esto borrará automáticamente sus RAs, Criterios y Notas.
        const result = await db.query('DELETE FROM Asignaturas WHERE id_asignatura = $1', [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'La asignatura no existe' });
        }

        res.json({ message: 'Asignatura eliminada correctamente' });
    } catch (err) {
        console.error("Error en DELETE /asignaturas:", err);
        res.status(500).json({ error: 'Error al eliminar la asignatura' });
    }
});

module.exports = router;