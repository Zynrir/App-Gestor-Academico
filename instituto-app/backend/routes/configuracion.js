const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/importar-asignatura', async (req, res) => {
    const { nombre, curso, color, id_usuario, estructura } = req.body;

    try {
        // 1. Crear Asignatura
        const resAsig = await db.query(
            'INSERT INTO Asignaturas (nombre, curso_academico, color_identificacion, id_usuario) VALUES ($1, $2, $3, $4) RETURNING id_asignatura',
            [nombre, curso, color, id_usuario]
        );
        const id_asignatura = resAsig.rows[0].id_asignatura;

        // 2. Recorrer la estructura de RAs y Criterios
        for (const ra of estructura) {
            const resRA = await db.query(
                'INSERT INTO Resultados_Aprendizaje (nombre, porcentaje, id_asignatura) VALUES ($1, $2, $3) RETURNING id_ra',
                [ra.nombre, ra.porcentaje, id_asignatura]
            );
            const id_ra = resRA.rows[0].id_ra;

            for (const cri of ra.criterios) {
                await db.query(
                    'INSERT INTO Criterios_Evaluacion (codigo, descripcion, id_ra) VALUES ($1, $2, $3)',
                    [cri.codigo, cri.descripcion, id_ra]
                );
            }
        }

        res.json({ message: 'Asignatura y criterios creados con éxito' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al importar la asignatura' });
    }
});

module.exports = router;