const express = require('express');
const router = express.Router();
const db = require('../db');

// --- MOTOR MATEMÁTICO: MEDIA PONDERADA REAL (IGNORA VACÍOS) ---
async function calcularNotaAsignatura(id_asignatura) {
    const ras = await db.query('SELECT id_ra, nombre, peso_porcentual FROM Resultados_Aprendizaje WHERE id_asignatura = $1 ORDER BY id_ra', [id_asignatura]);
    
    let cursoTotal = 0;
    let reporte = [];

    for (let ra of ras.rows) {
        const criterios = await db.query('SELECT id_criterio, peso_en_ra FROM Criterios_Evaluacion WHERE id_ra = $1', [ra.id_ra]);
        
        let sumaNotasPorPeso = 0;
        let sumaPesosDeLoCalificado = 0; // <--- CAMBIO CLAVE: Solo sumamos peso si hay nota

        for (let cri of criterios.rows) {
            const pesoCriterio = parseFloat(cri.peso_en_ra); 

            const notasRes = await db.query(`
                SELECT nota_obtenida FROM Calificaciones cal
                JOIN Criterios_Actividad ca ON cal.id_criterio_actividad = ca.id_criterio_actividad
                WHERE ca.id_criterio = $1
            `, [cri.id_criterio]);

            if (notasRes.rows.length > 0) {
                // Hay nota: la procesamos y SUMAMOS SU PESO al divisor
                const sumaNotas = notasRes.rows.reduce((sum, n) => sum + parseFloat(n.nota_obtenida), 0);
                const mediaCriterio = sumaNotas / notasRes.rows.length;
                
                sumaNotasPorPeso += mediaCriterio * pesoCriterio;
                sumaPesosDeLoCalificado += pesoCriterio; // Solo cuenta si está calificado
            }
        }

        // --- CÁLCULO FINAL ---
        let puntuacionRA = 0;
        
        if (sumaPesosDeLoCalificado > 0) {
            // Media Ponderada: (Notas * Pesos) / (Pesos de lo que has hecho)
            // Si tienes un 5.5 en una tarea de peso 5, y nada más: (27.5 / 5) = 5.5
            puntuacionRA = sumaNotasPorPeso / sumaPesosDeLoCalificado;
        } else {
            puntuacionRA = 0; // Si no has hecho nada en este RA
        }

        // Contribución: Aquí sí aplicamos el peso global del RA (25%)
        let contribucionRaw = puntuacionRA * parseFloat(ra.peso_porcentual);
        let contribucionRedondeada = parseFloat(contribucionRaw.toFixed(2));

        cursoTotal += contribucionRedondeada;

        reporte.push({
            ra_nombre: ra.nombre,
            peso_ra: (parseFloat(ra.peso_porcentual) * 100).toFixed(0) + '%',
            puntuacion: puntuacionRA.toFixed(2), // Debería salir 5.50
            contribucion: contribucionRedondeada.toFixed(2) // Debería salir 1.38
        });
    }

    return {
        detalles: reporte,
        nota_final: cursoTotal.toFixed(2)
    };
}

router.get('/resumen-curso/:id_asignatura', async (req, res) => {
    try {
        const datos = await calcularNotaAsignatura(req.params.id_asignatura);
        res.json({ detalles: datos.detalles, nota_final_curso: datos.nota_final });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error cálculo detalle' });
    }
});

router.get('/todas', async (req, res) => {
    try {
        const asignaturas = await db.query('SELECT id_asignatura FROM Asignaturas');
        const resultados = {};
        for (let asig of asignaturas.rows) {
            const datos = await calcularNotaAsignatura(asig.id_asignatura);
            resultados[asig.id_asignatura] = datos.nota_final;
        }
        res.json(resultados);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error cálculo global' });
    }
});

module.exports = router;