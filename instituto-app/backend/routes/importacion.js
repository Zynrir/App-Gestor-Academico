const express = require('express');
const router = express.Router();
const db = require('../db');

// POST: Importar RAs y Criterios desde JSON (generado por el Excel en el frontend)
router.post('/estructura', async (req, res) => {
    const { id_asignatura, datos } = req.body;

    if (!id_asignatura || !datos || !Array.isArray(datos)) {
        return res.status(400).json({ error: 'Datos de importación inválidos o incompletos' });
    }

    try {
        await db.query('BEGIN');

        for (const fila of datos) {
            // Extraemos los nombres exactos que deben venir en las cabeceras del Excel
            const ra_nombre = fila.ra_nombre;
            const ra_peso = fila.ra_peso;
            const cri_codigo = fila.cri_codigo;
            const cri_descripcion = fila.cri_descripcion;
            const cri_peso = fila.cri_peso;

            // Validar que la fila tenga contenido mínimo
            if (!ra_nombre || !cri_codigo) continue;

            // 1. Insertar el RA (Si ya existe por nombre+asignatura, no hace nada gracias al CONSTRAINT)
            // Usamos RETURNING para obtener el ID tanto si es nuevo como si ya existía
            let raRes = await db.query(
                `INSERT INTO Resultados_Aprendizaje (id_asignatura, nombre, ponderacion)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (id_asignatura, nombre) 
                 DO UPDATE SET nombre = EXCLUDED.nombre
                 RETURNING id_ra`,
                [id_asignatura, ra_nombre, ra_peso || 0]
            );
            
            const id_ra = raRes.rows[0].id_ra;

            // 2. Insertar el Criterio vinculado a ese RA
            await db.query(
                `INSERT INTO Criterios_Evaluacion (id_ra, codigo, descripcion, peso_en_ra)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (id_ra, codigo) DO NOTHING`, 
                [id_ra, cri_codigo, cri_descripcion, cri_peso || 0]
            );
        }

        await db.query('COMMIT');
        res.json({ message: 'Importación finalizada con éxito' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error("Error crítico en importación:", err);
        res.status(500).json({ error: 'Error en el servidor al procesar el archivo' });
    }
});

module.exports = router;