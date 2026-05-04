const express = require('express');
const router = express.Router();
const db = require('../db');

// GET: Obtener LA MALLA COMPLETA
router.get('/asignatura/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Obtener Estructura (Filas: RAs y Criterios)
        const queryEstructura = `
            SELECT 
                ra.id_ra, ra.nombre as ra_nombre, ra.peso_porcentual as ra_peso,
                ce.id_criterio, ce.codigo, ce.descripcion
            FROM Resultados_Aprendizaje ra
            JOIN Criterios_Evaluacion ce ON ra.id_ra = ce.id_ra
            WHERE ra.id_asignatura = $1
            ORDER BY ra.id_ra, ce.codigo;
        `;
        const estructura = await db.query(queryEstructura, [id]);

        // 2. Obtener Columnas (Actividades)
        // Devuelve TODAS las actividades de la asignatura, ordenadas por fecha.
        const queryActividades = `
            SELECT id_actividad, nombre, tipo, fecha_limite, estado
            FROM Actividades 
            WHERE id_asignatura = $1 
            ORDER BY fecha_limite ASC;
        `;
        const actividades = await db.query(queryActividades, [id]);

        // 3. Obtener Celdas (Vínculos y Notas)
        // LEFT JOIN vital para traer criterios aunque no tengan nota
        const queryNotas = `
            SELECT 
                ca.id_actividad, 
                ca.id_criterio, 
                cal.nota_obtenida
            FROM Criterios_Actividad ca
            JOIN Actividades a ON ca.id_actividad = a.id_actividad
            LEFT JOIN Calificaciones cal ON ca.id_criterio_actividad = cal.id_criterio_actividad
            WHERE a.id_asignatura = $1;
        `;
        const notas = await db.query(queryNotas, [id]);

        res.json({
            estructura: estructura.rows,
            actividades: actividades.rows,
            notas: notas.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener la malla de calificaciones' });
    }
});

// POST: Guardar una nota (Upsert)
router.post('/', async (req, res) => {
    const { id_actividad, id_criterio, nota } = req.body;

    try {
        // 1. Verificar o crear el vínculo en Criterios_Actividad
        let caQuery = "SELECT id_criterio_actividad FROM Criterios_Actividad WHERE id_actividad = $1 AND id_criterio = $2";
        let caRes = await db.query(caQuery, [id_actividad, id_criterio]);

        let id_ca;
        if (caRes.rows.length === 0) {
            const insertCA = `INSERT INTO Criterios_Actividad (id_criterio, id_actividad, puntuacion_maxima) 
                              VALUES ($1, $2, 10) RETURNING id_criterio_actividad`;
            const newCA = await db.query(insertCA, [id_criterio, id_actividad]);
            id_ca = newCA.rows[0].id_criterio_actividad;
        } else {
            id_ca = caRes.rows[0].id_criterio_actividad;
        }

        // 2. Insertar o Actualizar la nota
        const upsertQuery = `
            INSERT INTO Calificaciones (id_criterio_actividad, nota_obtenida)
            VALUES ($1, $2)
            ON CONFLICT (id_criterio_actividad) 
            DO UPDATE SET nota_obtenida = EXCLUDED.nota_obtenida;
        `;
        await db.query(upsertQuery, [id_ca, nota]);

        res.json({ message: 'Nota guardada correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al guardar nota' });
    }
});

// DELETE: Borrar una nota pasando los IDs por URL
// NUEVO: Esto soluciona el error al dejar la casilla vacía
router.delete('/:id_actividad/:id_criterio', async (req, res) => {
    const { id_actividad, id_criterio } = req.params;

    try {
        // 1. Buscamos el ID del vínculo
        const findQuery = `
            SELECT id_criterio_actividad 
            FROM Criterios_Actividad 
            WHERE id_actividad = $1 AND id_criterio = $2
        `;
        const result = await db.query(findQuery, [id_actividad, id_criterio]);

        if (result.rows.length > 0) {
            const id_ca = result.rows[0].id_criterio_actividad;
            
            // 2. Borramos la nota de la tabla Calificaciones
            const deleteQuery = `DELETE FROM Calificaciones WHERE id_criterio_actividad = $1`;
            await db.query(deleteQuery, [id_ca]);
        }

        res.json({ message: 'Nota eliminada correctamente' });

    } catch (error) {
        console.error("Error borrando nota:", error);
        res.status(500).json({ error: 'Error al borrar la nota' });
    }
});

module.exports = router;