const express = require('express');
const router = express.Router();
const db = require('../db');

// GET: Estructura completa
router.get('/:id_asignatura', async (req, res) => {
    try {
        const { id_asignatura } = req.params;
        const ras = await db.query('SELECT * FROM Resultados_Aprendizaje WHERE id_asignatura = $1 ORDER BY id_ra', [id_asignatura]);
        
        const criterios = await db.query(
            `SELECT c.* FROM Criterios_Evaluacion c
             JOIN Resultados_Aprendizaje r ON c.id_ra = r.id_ra
             WHERE r.id_asignatura = $1
             ORDER BY c.codigo`,
            [id_asignatura]
        );

        const estructura = ras.rows.map(ra => ({
            ...ra,
            criterios: criterios.rows.filter(c => c.id_ra === ra.id_ra)
        }));

        res.json(estructura);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener estructura' });
    }
});

// NUEVA RUTA: Importación masiva desde Excel/JSON
router.post('/importar', async (req, res) => {
    const { id_asignatura, datos } = req.body;

    if (!id_asignatura || !datos || !Array.isArray(datos)) {
        return res.status(400).json({ error: 'Datos de importación inválidos' });
    }

    try {
        await db.query('BEGIN');

        for (const fila of datos) {
            const { ra_nombre, ra_peso, cri_codigo, cri_descripcion, cri_peso } = fila;

            // Saltar si la fila está vacía
            if (!ra_nombre || !cri_codigo) continue;

            // 1. Insertar o Actualizar RA (usando peso_porcentual)
            let raRes = await db.query(
                `INSERT INTO Resultados_Aprendizaje (id_asignatura, nombre, peso_porcentual)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (id_asignatura, nombre) 
                 DO UPDATE SET peso_porcentual = EXCLUDED.peso_porcentual
                 RETURNING id_ra`,
                [id_asignatura, ra_nombre, ra_peso || 0]
            );
            
            const id_ra = raRes.rows[0].id_ra;

            // 2. Insertar o Actualizar Criterio (usando peso_en_ra)
            await db.query(
                `INSERT INTO Criterios_Evaluacion (id_ra, codigo, descripcion, peso_en_ra)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (id_ra, codigo) 
                 DO UPDATE SET descripcion = EXCLUDED.descripcion, peso_en_ra = EXCLUDED.peso_en_ra`, 
                [id_ra, cri_codigo, cri_descripcion, cri_peso || 0]
            );
        }

        await db.query('COMMIT');
        res.json({ message: 'Estructura importada y actualizada correctamente' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error("Error en importación masiva:", err);
        res.status(500).json({ error: 'Fallo en la base de datos al importar' });
    }
});

// POST: Crear RA individual
router.post('/ra', async (req, res) => {
    try {
        const { id_asignatura, nombre, peso_porcentual } = req.body;
        const newRa = await db.query(
            'INSERT INTO Resultados_Aprendizaje (id_asignatura, nombre, peso_porcentual) VALUES ($1, $2, $3) RETURNING *',
            [id_asignatura, nombre, peso_porcentual]
        );
        res.json(newRa.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creando RA' });
    }
});

// POST: Crear Criterio individual
router.post('/criterio', async (req, res) => {
    try {
        const { id_ra, codigo, descripcion, peso_en_ra } = req.body;
        const newCri = await db.query(
            'INSERT INTO Criterios_Evaluacion (id_ra, codigo, descripcion, peso_en_ra) VALUES ($1, $2, $3, $4) RETURNING *',
            [id_ra, codigo, descripcion, peso_en_ra]
        );
        res.json(newCri.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creando Criterio' });
    }
});

// DELETE: Borrar RA
router.delete('/ra/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM Resultados_Aprendizaje WHERE id_ra = $1', [req.params.id]);
        res.json({ message: 'RA eliminado' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar RA' });
    }
});

// DELETE: Borrar Criterio
router.delete('/criterio/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM Criterios_Evaluacion WHERE id_criterio = $1', [req.params.id]);
        res.json({ message: 'Criterio eliminado' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar criterio' });
    }
});

module.exports = router;