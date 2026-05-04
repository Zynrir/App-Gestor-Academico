import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const PracticasPage = () => {
    const [ajustes, setAjustes] = useState({ horas_totales: 504, horas_diarias: 8, horas_realizadas: 0 });
    const [horasRestantes, setHorasRestantes] = useState(0);
    const [fechaEstimada, setFechaEstimada] = useState('');
    const [festivos, setFestivos] = useState([]);
    
    // Estado para el formulario de nuevo festivo
    const [nuevoFestivo, setNuevoFestivo] = useState({ fecha: '', descripcion: '' });

    // Cargar datos al entrar
    const fetchPracticas = async () => {
        try {
            const res = await axiosClient.get('/practicas');
            setAjustes(res.data.ajustes);
            setHorasRestantes(res.data.horas_restantes);
            setFechaEstimada(res.data.fecha_estimada);
            setFestivos(res.data.festivos);
        } catch (error) {
            console.error("Error al cargar prácticas:", error);
        }
    };

    useEffect(() => {
        fetchPracticas();
    }, []);

    // Guardar ajustes manuales
    const handleGuardarAjustes = async () => {
        try {
            await axiosClient.put('/practicas', ajustes);
            fetchPracticas(); // Recargar para recalcular fecha
            alert('Ajustes guardados correctamente');
        } catch (error) {
            alert('Error al guardar ajustes');
        }
    };

    // Botón rápido: Sumar un día de trabajo
    const handleSumarJornada = async () => {
        const nuevasHoras = parseFloat(ajustes.horas_realizadas) + parseFloat(ajustes.horas_diarias);
        if (nuevasHoras > ajustes.horas_totales) {
            alert('¡Ya has superado el total de horas!');
            return;
        }
        
        const nuevosAjustes = { ...ajustes, horas_realizadas: nuevasHoras };
        try {
            await axiosClient.put('/practicas', nuevosAjustes);
            fetchPracticas();
        } catch (error) {
            alert('Error al sumar jornada');
        }
    };

    // Añadir festivo
    const handleAddFestivo = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post('/practicas/festivos', nuevoFestivo);
            setNuevoFestivo({ fecha: '', descripcion: '' });
            fetchPracticas();
        } catch (error) {
            alert('Error al añadir festivo');
        }
    };

    // Borrar festivo
    const handleDeleteFestivo = async (fecha) => {
        // Formateamos la fecha para la URL
        const fechaFormat = fecha.split('T')[0];
        try {
            await axiosClient.delete(`/practicas/festivos/${fechaFormat}`);
            fetchPracticas();
        } catch (error) {
            alert('Error al eliminar festivo');
        }
    };

    // Cálculo del porcentaje para la barra de progreso
    const porcentaje = ajustes.horas_totales > 0 
        ? Math.min(100, ((ajustes.horas_realizadas / ajustes.horas_totales) * 100)).toFixed(1) 
        : 0;

    // Formatear la fecha estimada para que se lea mejor en español
    const fechaFormateada = fechaEstimada 
        ? new Date(fechaEstimada).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : 'Calculando...';

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Control de Prácticas (FCT)</h1>

            {/* TARJETAS DE RESUMEN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex flex-col items-center text-center">
                    <span className="text-gray-500 font-bold mb-2">Horas Realizadas</span>
                    <span className="text-4xl font-black text-blue-600">{ajustes.horas_realizadas} <span className="text-lg text-gray-400">/ {ajustes.horas_totales}</span></span>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex flex-col items-center text-center">
                    <span className="text-gray-500 font-bold mb-2">Horas Restantes</span>
                    <span className="text-4xl font-black text-orange-500">{horasRestantes} <span className="text-lg text-gray-400">h</span></span>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-xl shadow text-white flex flex-col items-center text-center justify-center">
                    <span className="text-blue-100 font-bold mb-2">Fecha Estimada de Fin 🎉</span>
                    <span className="text-xl font-bold capitalize">{fechaFormateada}</span>
                </div>
            </div>

            {/* BARRA DE PROGRESO */}
            <div className="bg-white p-6 rounded-xl shadow border border-gray-100 mb-8">
                <div className="flex justify-between items-end mb-2">
                    <span className="font-bold text-gray-700">Progreso Total</span>
                    <span className="font-black text-blue-600 text-xl">{porcentaje}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                    <div className="bg-blue-600 h-4 rounded-full transition-all duration-500" style={{ width: `${porcentaje}%` }}></div>
                </div>
                <button 
                    onClick={handleSumarJornada}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg shadow transition-colors"
                >
                    + Añadir Jornada de Hoy ({ajustes.horas_diarias}h)
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* PANEL DE AJUSTES */}
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Configuración</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Total de Horas (FCT)</label>
                            <input 
                                type="number" 
                                className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                                value={ajustes.horas_totales}
                                onChange={(e) => setAjustes({...ajustes, horas_totales: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Horas Diarias</label>
                            <input 
                                type="number" step="0.5"
                                className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                                value={ajustes.horas_diarias}
                                onChange={(e) => setAjustes({...ajustes, horas_diarias: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Horas Realizadas (Ajuste Manual)</label>
                            <input 
                                type="number" step="0.5"
                                className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                                value={ajustes.horas_realizadas}
                                onChange={(e) => setAjustes({...ajustes, horas_realizadas: e.target.value})}
                            />
                        </div>
                        <button 
                            onClick={handleGuardarAjustes}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold w-full"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </div>

                {/* PANEL DE FESTIVOS */}
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Días Festivos (No laborables)</h2>
                    
                    <form onSubmit={handleAddFestivo} className="flex gap-2 mb-6">
                        <input 
                            type="date" 
                            required
                            className="border rounded p-2 text-sm flex-1"
                            value={nuevoFestivo.fecha}
                            onChange={(e) => setNuevoFestivo({...nuevoFestivo, fecha: e.target.value})}
                        />
                        <input 
                            type="text" 
                            required placeholder="Ej: Jueves Santo" 
                            className="border rounded p-2 text-sm flex-2 w-full"
                            value={nuevoFestivo.descripcion}
                            onChange={(e) => setNuevoFestivo({...nuevoFestivo, descripcion: e.target.value})}
                        />
                        <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold hover:bg-gray-700">Añadir</button>
                    </form>

                    <div className="overflow-y-auto max-h-64">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-gray-500 font-bold">Fecha</th>
                                    <th className="px-3 py-2 text-left text-gray-500 font-bold">Descripción</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {festivos.length === 0 ? (
                                    <tr><td colSpan="3" className="text-center py-4 text-gray-400">No hay festivos registrados</td></tr>
                                ) : (
                                    festivos.map(f => (
                                        <tr key={f.fecha} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 font-medium">{new Date(f.fecha).toLocaleDateString('es-ES')}</td>
                                            <td className="px-3 py-2 text-gray-600">{f.descripcion}</td>
                                            <td className="px-3 py-2 text-right">
                                                <button onClick={() => handleDeleteFestivo(f.fecha)} className="text-red-500 hover:text-red-700 font-bold text-lg">✕</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PracticasPage;