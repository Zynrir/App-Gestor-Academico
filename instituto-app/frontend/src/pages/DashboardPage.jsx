import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
    const [asignaturas, setAsignaturas] = useState([]);
    const [tareasUrgentes, setTareasUrgentes] = useState([]);
    const [todasLasTareas, setTodasLasTareas] = useState([]);
    const [notasCalculadas, setNotasCalculadas] = useState({});
    const [loading, setLoading] = useState(true);

    const estadosPendientes = ['Sin hacer', 'Abierta', 'Terminar', 'A falta de entrega'];

    const cargarDatos = async () => {
        try {
            const resAsig = await axiosClient.get('/asignaturas/usuario/1');
            setAsignaturas(resAsig.data);

            const resNotas = await axiosClient.get('/calculo/todas');
            setNotasCalculadas(resNotas.data);

            const resTareas = await axiosClient.get('/tareas/usuario/1');
            
            // --- LÓGICA DE PRIORIDAD DINÁMICA ---
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0); // Hoy a las 00:00:00

            const tareasProcesadas = resTareas.data.map(t => {
                // 1. Convertimos strings a Objetos Fecha
                const fOptima = t.fecha_optima ? new Date(t.fecha_optima) : null;
                const fLimite = new Date(t.fecha_limite);

                // 2. CORRECCIÓN IMPORTANTE: Forzamos las horas a 00:00:00 para evitar decimales por zona horaria
                if (fOptima) fOptima.setHours(0, 0, 0, 0);
                fLimite.setHours(0, 0, 0, 0);
                
                // 3. Elegimos fecha de referencia
                const fechaReferencia = (fOptima && fOptima >= hoy) ? fOptima : fLimite;
                
                // 4. Calculamos diferencia
                const diffMS = fechaReferencia.getTime() - hoy.getTime();
                
                // Math.round es más seguro aquí si ya hemos reseteado las horas, 
                // pero mantenemos Math.ceil por si acaso queda algún milisegundo suelto.
                const dias = Math.ceil(diffMS / (1000 * 60 * 60 * 24));

                let prioridadAuto = 'Baja';
                if (dias <= 3) prioridadAuto = 'Alta';
                else if (dias <= 7) prioridadAuto = 'Media';

                return { ...t, prioridadDinamica: prioridadAuto, diasRestantes: dias };
            });

            setTodasLasTareas(tareasProcesadas);
            
            const urgentes = tareasProcesadas.filter(t => 
                estadosPendientes.includes(t.estado) && t.diasRestantes <= 7 && t.diasRestantes >= 0
            );

            setTareasUrgentes(urgentes.sort((a, b) => {
                if (a.prioridadDinamica === 'Alta' && b.prioridadDinamica !== 'Alta') return -1;
                return a.diasRestantes - b.diasRestantes;
            }));

            setLoading(false);
        } catch (error) {
            console.error("Error cargando dashboard:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const manejarCambioEstado = async (tareaId, nuevoEstado) => {
        try {
            await axiosClient.put(`/tareas/${tareaId}`, { estado: nuevoEstado });
            cargarDatos();
        } catch (error) {
            console.error("Error al actualizar estado:", error);
            alert("Error al actualizar el estado");
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500 font-medium">Calculando prioridades y notas...</div>;

    const tareasHojaRuta = todasLasTareas
        .filter(t => estadosPendientes.includes(t.estado))
        .sort((a, b) => a.diasRestantes - b.diasRestantes);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* SECCIÓN ASIGNATURAS */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    📚 Mis Asignaturas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {asignaturas.map((asig) => {
                        const valorCrudo = parseFloat(notasCalculadas[asig.id_asignatura] || 0);
                        const notaReal = (Math.round(valorCrudo * 100) / 100).toFixed(2);
                        
                        const notaCorte = 5.0;
                        const esAprobado = valorCrudo >= notaCorte;
                        const diferencia = Math.abs(notaCorte - valorCrudo).toFixed(2);

                        return (
                            <div key={asig.id_asignatura} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col hover:shadow-lg transition-shadow">
                                <div className="h-2 w-full" style={{ backgroundColor: asig.color_identificacion || '#3B82F6' }}></div>
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold text-gray-900">{asig.nombre}</h3>
                                        <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded font-bold uppercase">{asig.curso_academico}</span>
                                    </div>
                                    
                                    <div className="flex items-end justify-between mt-4">
                                        <span className="text-gray-400 text-xs font-bold uppercase mb-2">Media Actual</span>
                                        <div className="text-right">
                                            <span className={`text-5xl font-black block ${valorCrudo === 0 ? 'text-gray-100' : valorCrudo < 5 ? 'text-red-500' : 'text-gray-900'}`}>
                                                {notaReal}
                                            </span>
                                            {valorCrudo > 0 && (
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full mt-1 inline-block ${esAprobado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                                    {esAprobado ? `🎉 Aprobado (+${diferencia})` : `📉 Faltan ${diferencia}`}
                                                </span>
                                            )}
                                            {valorCrudo === 0 && <span className="text-[10px] text-gray-300 mt-1 block">Sin calificar</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 border-t border-gray-100 p-0 flex divide-x divide-gray-200 text-center">
                                    <Link to={`/tareas?asignatura=${asig.id_asignatura}`} className="flex-1 text-xs font-bold text-gray-500 hover:text-blue-600 py-3 transition-colors uppercase tracking-wider">Tareas</Link>
                                    <Link to={`/calificaciones?asignatura=${asig.id_asignatura}`} className="flex-1 text-xs font-bold text-gray-500 hover:text-blue-600 py-3 transition-colors uppercase tracking-wider">Notas</Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* SECCIÓN TAREAS URGENTES */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    ⏱️ Entregas Urgentes (Prioridad Inteligente)
                </h2>
                {tareasUrgentes.length === 0 ? (
                    <div className="bg-green-50 text-green-700 p-6 rounded-xl border border-green-100 text-center font-medium">
                        ✅ ¡Todo bajo control! No tienes tareas con prioridad alta o media esta semana.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {tareasUrgentes.map(tarea => (
                            <div key={tarea.id_tarea} className={`relative bg-white p-5 rounded-xl border transition-all shadow-sm ${tarea.prioridadDinamica === 'Alta' ? 'border-red-200 border-l-4 border-l-red-600' : 'border-gray-100 border-l-4 border-l-orange-400'}`}>
                                
                                {tarea.prioridadDinamica === 'Alta' && (
                                    <div className="absolute -top-3 right-2 bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded shadow-lg animate-pulse uppercase">
                                        Prioridad Crítica 🔥
                                    </div>
                                )}

                                <h4 className="font-bold text-gray-800 text-sm mb-2 line-clamp-2">{tarea.titulo}</h4>
                                
                                <div className="space-y-1 mb-4">
                                    <p className={`text-[10px] font-black uppercase ${tarea.prioridadDinamica === 'Alta' ? 'text-red-600' : 'text-orange-500'}`}>
                                        Prioridad {tarea.prioridadDinamica}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{tarea.estado}</p>
                                </div>

                                <div className="pt-2 border-t border-gray-50">
                                    <span className={`text-[10px] uppercase font-black px-2 py-1 rounded block text-center ${tarea.diasRestantes <= 1 ? 'bg-red-100 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                        {tarea.diasRestantes <= 0 ? "¡ENTREGA HOY!" : `Faltan ${tarea.diasRestantes} días`}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* SECCIÓN HOJA DE RUTA */}
            <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    📋 Hoja de Ruta (Todo lo pendiente)
                </h2>
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase">Módulo</th>
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase">Tarea</th>
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase">Plazo</th>
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tareasHojaRuta.map(tarea => {
                                    const hoy = new Date();
                                    const fOptima = tarea.fecha_optima ? new Date(tarea.fecha_optima) : null;
                                    const esCritico = !fOptima || hoy > fOptima;

                                    return (
                                        <tr key={tarea.id_tarea} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors">
                                            <td className="p-4">
                                                <span className="text-xs font-bold text-blue-600">
                                                    {asignaturas.find(a => a.id_asignatura === tarea.id_asignatura)?.nombre}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm font-bold text-gray-800">{tarea.titulo}</div>
                                                <div className="text-[9px] font-bold text-gray-400 uppercase">{tarea.prioridadDinamica} • {tarea.estado}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className={`text-[10px] font-black px-2 py-1 rounded inline-block ${esCritico ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                                                    {esCritico ? 'LÍMITE: ' : 'ÓPTIMA: '}
                                                    {new Date(esCritico ? tarea.fecha_limite : tarea.fecha_optima).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <select 
                                                    value={tarea.estado}
                                                    onChange={(e) => manejarCambioEstado(tarea.id_tarea, e.target.value)}
                                                    className="text-[10px] font-bold p-1.5 rounded-lg border border-gray-200 bg-white"
                                                >
                                                    <option value="Sin hacer">Sin hacer</option>
                                                    <option value="Abierta">Abierta</option>
                                                    <option value="Terminar">Terminar</option>
                                                    <option value="A falta de entrega">A falta de entrega</option>
                                                    <option value="Entregada">✅ Entregada</option>
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default DashboardPage;