const express = require('express');
const router = express.Router();
const db = require('../db');

// GET: Obtener solo los EXÁMENES de un usuario
router.get('/usuario/:id_usuario', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT a.id_actividad as id_examen, a.nombre as titulo, a.fecha_limite as fecha, a.tipo, 
                   asig.nombre as asignatura_nombre, asig.color_identificacion 
            FROM Actividades a
            JOIN Asignaturas asig ON a.id_asignatura = asig.id_asignatura
            WHERE a.id_asignatura IN (SELECT id_asignatura FROM Asignaturas WHERE id_usuario = $1)
            AND a.tipo IN ('Examen Teorico', 'Examen Practico')
            ORDER BY a.fecha_limite ASC
        `, [req.params.id_usuario]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener exámenes' });
    }
});

// POST: Crear nuevo examen (Lo guardamos como Actividad)
router.post('/', async (req, res) => {
    // Nota: Mapeamos 'titulo' a 'nombre' y 'fecha' a 'fecha_limite' de tu BD
    const { id_asignatura, titulo, tipo, fecha } = req.body;
    
    try {
        const result = await db.query(
            `INSERT INTO Actividades 
            (id_asignatura, nombre, tipo, estado, fecha_limite, prioridad) 
            VALUES ($1, $2, $3, 'Abierta', $4, 'Alta') 
            RETURNING *`,
            [id_asignatura, titulo, tipo, fecha]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear examen' });
    }
});

// DELETE: Borrar examen
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM Actividades WHERE id_actividad = $1', [req.params.id]);
        res.json({ message: 'Examen eliminado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar examen' });
    }
});

module.exports = router;