const express = require('express');
const router = express.Router();
const db = require('../db');

// Función auxiliar para calcular la fecha de fin real
const calcularFechaFin = (horas_restantes, horas_diarias, festivosArray) => {
    // Si ya no te quedan horas, ¡has terminado!
    if (horas_restantes <= 0) return new Date(); 

    // Calculamos cuántos días enteros necesitas ir a la empresa
    let dias_necesarios = Math.ceil(horas_restantes / horas_diarias);
    let fechaActual = new Date(); // Empezamos a contar desde hoy mismo

    // Convertimos los festivos de la base de datos a un formato de texto fácil de comparar ('YYYY-MM-DD')
    const festivosStr = festivosArray.map(f => {
        const d = new Date(f.fecha);
        return d.toISOString().split('T')[0];
    });

    // El bucle del tiempo: avanza día a día hasta cumplir los días necesarios
    while (dias_necesarios > 0) {
        // Avanzamos un día en el calendario
        fechaActual.setDate(fechaActual.getDate() + 1);
        
        const diaSemana = fechaActual.getDay(); // 0 es Domingo, 6 es Sábado
        const fechaString = fechaActual.toISOString().split('T')[0];

        // CONDICIÓN: Si NO es fin de semana (0 o 6) Y NO está en la lista de festivos
        if (diaSemana !== 0 && diaSemana !== 6 && !festivosStr.includes(fechaString)) {
            // Entonces sí es un día laborable de prácticas, restamos uno a los que te faltan
            dias_necesarios--;
        }
    }
    
    return fechaActual;
};

// GET: Obtener el resumen completo y la fecha calculada
router.get('/', async (req, res) => {
    try {
        // 1. Obtener tu configuración (horas totales, diarias y realizadas)
        const ajusteRes = await db.query('SELECT * FROM Practicas_Ajustes WHERE id_usuario = 1');
        let ajustes = ajusteRes.rows[0];

        if (!ajustes) {
            ajustes = { horas_totales: 504, horas_diarias: 8, horas_realizadas: 0 };
        }

        // 2. Obtener tu lista de festivos personalizados
        const festivosRes = await db.query('SELECT fecha, descripcion FROM Festivos ORDER BY fecha ASC');
        const festivos = festivosRes.rows;

        // 3. ¡Que trabaje el algoritmo!
        const horas_restantes = ajustes.horas_totales - ajustes.horas_realizadas;
        const fecha_estimada = calcularFechaFin(horas_restantes, ajustes.horas_diarias, festivos);

        res.json({
            ajustes,
            horas_restantes,
            fecha_estimada: fecha_estimada.toISOString().split('T')[0],
            festivos
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener datos de prácticas' });
    }
});

// PUT: Guardar cuando modifiques tus horas (ej. sumar las 8h de hoy)
router.put('/', async (req, res) => {
    const { horas_totales, horas_diarias, horas_realizadas } = req.body;
    try {
        const query = `
            UPDATE Practicas_Ajustes 
            SET horas_totales = $1, horas_diarias = $2, horas_realizadas = $3
            WHERE id_usuario = 1
        `;
        await db.query(query, [horas_totales, horas_diarias, horas_realizadas]);
        res.json({ message: 'Ajustes guardados correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar prácticas' });
    }
});

// POST: Añadir un día festivo nuevo
router.post('/festivos', async (req, res) => {
    const { fecha, descripcion } = req.body;
    try {
        await db.query('INSERT INTO Festivos (fecha, descripcion) VALUES ($1, $2) ON CONFLICT (fecha) DO NOTHING', [fecha, descripcion]);
        res.json({ message: 'Día festivo añadido' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al añadir festivo' });
    }
});

// DELETE: Quitar un festivo si te equivocaste
router.delete('/festivos/:fecha', async (req, res) => {
    const { fecha } = req.params;
    try {
        await db.query('DELETE FROM Festivos WHERE fecha = $1', [fecha]);
        res.json({ message: 'Festivo eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar festivo' });
    }
});

module.exports = router;