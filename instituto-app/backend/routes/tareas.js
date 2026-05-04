const express = require('express');
const router = express.Router();
const db = require('../db');

// GET: Tareas de un usuario
router.get('/usuario/:id_usuario', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM Tareas WHERE id_usuario = $1 ORDER BY fecha_limite ASC', [req.params.id_usuario]);
        const tareas = result.rows;
        for (let tarea of tareas) {
            const criteriosRes = await db.query('SELECT id_criterio FROM Tarea_Criterios WHERE id_tarea = $1', [tarea.id_tarea]);
            tarea.criterios_ids = criteriosRes.rows.map(row => row.id_criterio);
        }
        res.json(tareas);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener tareas' });
    }
});

// GET Criterios
router.get('/criterios-asignatura/:id_asignatura', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT ra.id_ra, ra.nombre as ra_nombre, ce.id_criterio, ce.codigo, ce.descripcion 
            FROM Resultados_Aprendizaje ra
            JOIN Criterios_Evaluacion ce ON ra.id_ra = ce.id_ra
            WHERE ra.id_asignatura = $1
            ORDER BY ra.id_ra, ce.codigo
        `, [req.params.id_asignatura]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error cargando criterios' });
    }
});

// POST: Crear Tarea
router.post('/', async (req, res) => {
    const { titulo, fecha_limite, fecha_optima, estado, id_asignatura, id_usuario, criterios_ids } = req.body;
    
    try {
        const resTarea = await db.query(
            'INSERT INTO Tareas (titulo, fecha_limite, fecha_optima, estado, id_asignatura, id_usuario) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [titulo, fecha_limite, fecha_optima, estado || 'Pendiente', id_asignatura, id_usuario]
        );
        const nuevaTarea = resTarea.rows[0];

        if (criterios_ids && criterios_ids.length > 0) {
            for (let id_criterio of criterios_ids) {
                await db.query('INSERT INTO Tarea_Criterios (id_tarea, id_criterio) VALUES ($1, $2)', [nuevaTarea.id_tarea, id_criterio]);
            }

            const resActividad = await db.query(
                "INSERT INTO Actividades (nombre, tipo, fecha, id_asignatura) VALUES ($1, 'Tarea', $2, $3) RETURNING id_actividad",
                [titulo, fecha_limite || new Date(), id_asignatura]
            );
            const idActividad = resActividad.rows[0].id_actividad;

            for (let id_criterio of criterios_ids) {
                await db.query(
                    'INSERT INTO Criterios_Actividad (id_actividad, id_criterio, peso_en_actividad) VALUES ($1, $2, 1)', 
                    [idActividad, id_criterio]
                );
            }
        }

        res.json(nuevaTarea);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear tarea' });
    }
});

// PUT: Editar o Actualizar Estado de Tarea (ACTUALIZADO PARA EL DASHBOARD)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { titulo, fecha_limite, fecha_optima, estado, criterios_ids } = req.body;

    try {
        // Buscamos la tarea actual para no perder datos si solo enviamos el estado
        const tareaActual = await db.query('SELECT * FROM Tareas WHERE id_tarea = $1', [id]);
        if (tareaActual.rows.length === 0) return res.status(404).json({ error: "Tarea no encontrada" });

        const t = tareaActual.rows[0];

        // Usamos los valores nuevos o mantenemos los viejos (Coalesce lógico)
        const v_titulo = titulo !== undefined ? titulo : t.titulo;
        const v_limite = fecha_limite !== undefined ? fecha_limite : t.fecha_limite;
        const v_optima = fecha_optima !== undefined ? fecha_optima : t.fecha_optima;
        const v_estado = estado !== undefined ? estado : t.estado;

        await db.query(
            'UPDATE Tareas SET titulo = $1, fecha_limite = $2, fecha_optima = $3, estado = $4 WHERE id_tarea = $5',
            [v_titulo, v_limite, v_optima, v_estado, id]
        );

        // Si se enviaron criterios_ids, actualizamos la relación (típico de la página de edición)
        if (criterios_ids !== undefined) {
            await db.query('DELETE FROM Tarea_Criterios WHERE id_tarea = $1', [id]);
            if (criterios_ids.length > 0) {
                for (let id_criterio of criterios_ids) {
                    await db.query('INSERT INTO Tarea_Criterios (id_tarea, id_criterio) VALUES ($1, $2)', [id, id_criterio]);
                }
            }
        }
        
        res.json({ message: 'Tarea actualizada correctamente', estado: v_estado });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar tarea' });
    }
});

// DELETE: Borrar Tarea y su Actividad vinculada
router.delete('/:id', async (req, res) => {
    try {
        const tareaRes = await db.query('SELECT titulo, id_asignatura FROM Tareas WHERE id_tarea = $1', [req.params.id]);
        
        if (tareaRes.rows.length > 0) {
            const { titulo, id_asignatura } = tareaRes.rows[0];
            await db.query('DELETE FROM Actividades WHERE nombre = $1 AND id_asignatura = $2', [titulo, id_asignatura]);
        }

        await db.query('DELETE FROM Tareas WHERE id_tarea = $1', [req.params.id]);
        res.json({ message: 'Tarea y Actividad vinculada eliminadas correctamente' });
    } catch (err) {
        console.error("Error al eliminar:", err);
        res.status(500).json({ error: 'Error al eliminar tarea' });
    }
});

module.exports = router;