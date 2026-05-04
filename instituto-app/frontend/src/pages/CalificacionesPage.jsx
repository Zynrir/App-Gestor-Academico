import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useLocation, Link } from 'react-router-dom';

const CalificacionesPage = () => {
    const [asignaturas, setAsignaturas] = useState([]);
    const [selectedAsignatura, setSelectedAsignatura] = useState('');
    const [isDashboardMode, setIsDashboardMode] = useState(false);
    
    const [estructura, setEstructura] = useState([]);
    const [columnas, setColumnas] = useState([]);
    const [notas, setNotas] = useState({});
    const [calculos, setCalculos] = useState({});

    // Estado para saber qué casillas son válidas (editables)
    const [celdasValidas, setCeldasValidas] = useState(new Set());

    const location = useLocation();

    // 1. Cargar lista de asignaturas
    useEffect(() => {
        axiosClient.get('/asignaturas/usuario/1').then(res => {
            setAsignaturas(res.data);
            const searchParams = new URLSearchParams(location.search);
            const idUrl = searchParams.get('asignatura');
            if (idUrl) {
                setSelectedAsignatura(idUrl);
                setIsDashboardMode(true);
            } else {
                setIsDashboardMode(false);
            }
        });
    }, [location]);

    // 2. Cargar datos de la asignatura seleccionada
    useEffect(() => {
        if (selectedAsignatura) {
            fetchTodo();
        } else {
            resetDatos();
        }
    }, [selectedAsignatura]);

    const resetDatos = () => {
        setEstructura([]);
        setColumnas([]);
        setNotas({});
        setCalculos({});
        setCeldasValidas(new Set()); // Reseteamos los permisos
    };

    const fetchTodo = async () => {
        try {
            const resMalla = await axiosClient.get(`/calificaciones/asignatura/${selectedAsignatura}`);
            setEstructura(resMalla.data.estructura);
            setColumnas(resMalla.data.actividades);
            
            const mapaNotas = {};
            const validas = new Set(); // Conjunto para guardar las combinaciones Actividad-Criterio permitidas

            resMalla.data.notas.forEach(n => {
                // Guardamos la "firma" de la celda válida
                validas.add(`${n.id_actividad}-${n.id_criterio}`);

                if (!mapaNotas[n.id_actividad]) mapaNotas[n.id_actividad] = {};
                // Solo guardamos la nota si no es null
                if (n.nota_obtenida !== null) {
                    mapaNotas[n.id_actividad][n.id_criterio] = n.nota_obtenida;
                }
            });
            
            setNotas(mapaNotas);
            setCeldasValidas(validas); // Guardamos el mapa de celdas editables

            const resCalculo = await axiosClient.get(`/calculo/resumen-curso/${selectedAsignatura}`);
            const mapaCalculos = {};
            resCalculo.data.detalles.forEach(det => {
                mapaCalculos[det.ra_nombre] = det;
            });
            setCalculos(mapaCalculos);

        } catch (error) {
            console.error("Error cargando calificaciones:", error);
        }
    };

    const handleDeleteTarea = async (id_actividad, nombre) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar la tarea "${nombre}"?`)) {
            try {
                await axiosClient.delete(`/tareas/${id_actividad}`);
                fetchTodo();
            } catch (error) {
                alert('Error al eliminar la tarea');
            }
        }
    };

    // --- FUNCIÓN CORREGIDA PARA BORRAR SIN ERRORES ---
    const handleGuardarNota = async (id_actividad, id_criterio, valor) => {
        try {
            if (valor === '' || valor === null) {
                // LÓGICA DE BORRADO: Usamos la URL parametrizada que espera el nuevo Backend
                await axiosClient.delete(`/calificaciones/${id_actividad}/${id_criterio}`);
            } else {
                // LÓGICA DE GUARDADO: Usamos POST como siempre
                await axiosClient.post('/calificaciones', { id_actividad, id_criterio, nota: valor });
            }
            fetchTodo();
        } catch (error) {
            console.error("Error gestionando nota:", error);
            // alert('Error al guardar la nota'); // Comentado para evitar molestias
        }
    };

    const agruparPorRA = () => {
        const grupos = {};
        estructura.forEach(d => {
            if (!grupos[d.id_ra]) {
                grupos[d.id_ra] = { nombre: d.ra_nombre, peso: d.ra_peso, criterios: [] };
            }
            grupos[d.id_ra].criterios.push(d);
        });
        return grupos;
    };

    const grupos = agruparPorRA();
    const currentAsignatura = asignaturas.find(a => a.id_asignatura == selectedAsignatura);

    // FUNCIÓN DE REDONDEO ESTILO MOODLE
    const redondearMoodle = (valor) => {
        const num = parseFloat(valor || 0);
        return (Math.round(num * 100) / 100).toFixed(2);
    };

    return (
        <div className="max-w-full mx-auto p-6">
            
            {!selectedAsignatura && (
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Consulta de Notas</h1>
                    <p className="text-gray-500 mb-8">Selecciona una asignatura para ver tus calificaciones.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {asignaturas.map((asig) => (
                            <div key={asig.id_asignatura} onClick={() => setSelectedAsignatura(asig.id_asignatura)} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer border border-gray-100">
                                <div className="h-2 w-full" style={{ backgroundColor: asig.color_identificacion || '#3B82F6' }}></div>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-800">{asig.nombre}</h3>
                                    <div className="mt-4 text-right text-sm text-blue-600 font-medium font-bold">Ver Calificaciones →</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedAsignatura && (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-end mb-6 border-b pb-4">
                        <div>
                            {isDashboardMode ? (
                                <Link to="/" className="text-sm text-gray-500 hover:text-blue-600 mb-1 flex items-center gap-1">← Volver al Dashboard</Link>
                            ) : (
                                <button onClick={() => setSelectedAsignatura('')} className="text-sm text-gray-500 hover:text-blue-600 mb-1 flex items-center gap-1">← Volver a Asignaturas</button>
                            )}
                            <h1 className="text-3xl font-bold text-gray-900">
                                Calificaciones: <span className="text-blue-600">{currentAsignatura?.nombre}</span>
                            </h1>
                        </div>
                    </div>

                    <div className="overflow-x-auto bg-white shadow rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-blue-600 text-white">
                                <tr>
                                    <th className="px-4 py-3 text-left sticky left-0 bg-blue-600 z-10 w-96 shadow-lg">Resultados de Aprendizaje</th>
                                    {columnas.map(col => (
                                        <th key={col.id_actividad} className="px-2 py-3 text-center min-w-[120px] border-l border-blue-400 group relative">
                                            <div className="font-bold">{col.nombre}</div>
                                            <div className="text-[10px] opacity-80 uppercase">{col.tipo}</div>
                                            {!isDashboardMode && (
                                                <button 
                                                    onClick={() => handleDeleteTarea(col.id_actividad, col.nombre)}
                                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] transition-opacity shadow-md"
                                                >✕</button>
                                            )}
                                        </th>
                                    ))}
                                    <th className="px-2 py-3 text-center bg-blue-800 border-l border-blue-400 min-w-[80px]">Media RA</th>
                                    <th className="px-2 py-3 text-center bg-indigo-900 border-l border-blue-400 min-w-[80px]">Contrib.</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {Object.values(grupos).map((ra) => {
                                    const datosRA = calculos[ra.nombre] || { puntuacion: 0, contribucion: 0 };
                                    return (
                                        <React.Fragment key={ra.nombre}>
                                            <tr className="bg-gray-100 font-bold">
                                                <td className="px-4 py-2 text-gray-800 sticky left-0 bg-gray-100 border-r border-gray-200 shadow-sm">
                                                    {ra.nombre} <span className="text-blue-600 text-xs">({(ra.peso * 100).toFixed(0)}%)</span>
                                                </td>
                                                {columnas.map(col => <td key={col.id_actividad} className="bg-gray-50 border-r border-gray-100"></td>)}
                                                
                                                <td className="text-center font-black text-blue-800 border-l border-gray-300 bg-blue-50">
                                                    {redondearMoodle(datosRA.puntuacion)}
                                                </td>
                                                <td className="text-center font-black text-indigo-900 border-l border-gray-300 bg-indigo-50">
                                                    {redondearMoodle(datosRA.contribucion)}
                                                </td>
                                            </tr>
                                            {ra.criterios.map(cri => (
                                                <tr key={cri.id_criterio} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-2 border-r border-gray-200 sticky left-0 bg-white shadow-sm">
                                                        <div className="flex justify-between items-baseline">
                                                            <span className="font-bold text-xs text-gray-500 mr-2">{cri.codigo}</span>
                                                            <span className="text-xs text-gray-400">({cri.peso_en_ra}%)</span>
                                                        </div>
                                                        <div className="text-gray-700 truncate max-w-xs text-xs mt-1" title={cri.descripcion}>{cri.descripcion}</div>
                                                    </td>
                                                    {columnas.map(col => {
                                                        const notaActual = notas[col.id_actividad]?.[cri.id_criterio] !== undefined 
                                                                            ? notas[col.id_actividad][cri.id_criterio] 
                                                                            : '';
                                                        
                                                        // Verificamos si esta combinación Actividad-Criterio existe en el backend
                                                        const esEditable = celdasValidas.has(`${col.id_actividad}-${cri.id_criterio}`);

                                                        return (
                                                            <td key={`${col.id_actividad}-${cri.id_criterio}`} className={`p-1 text-center border-r border-gray-100 ${!esEditable ? 'bg-gray-100/50' : ''}`}>
                                                                {esEditable ? (
                                                                    <input 
                                                                        type="number" min="0" max="10" step="0.1"
                                                                        className={`w-12 text-center rounded p-1 text-sm outline-none border transition-all 
                                                                            ${notaActual !== '' ? 'bg-yellow-50 font-bold border-yellow-300 text-gray-800' : 'border-gray-200 text-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
                                                                        placeholder="-"
                                                                        defaultValue={notaActual}
                                                                        onBlur={(e) => handleGuardarNota(col.id_actividad, cri.id_criterio, e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') e.target.blur();
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-12 h-8 mx-auto flex items-center justify-center opacity-20 select-none cursor-default" title="Esta tarea no evalúa este criterio">
                                                                        <span className="text-[10px] text-gray-400">●</span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="bg-gray-50 border-l border-gray-200"></td>
                                                    <td className="bg-gray-50 border-l border-gray-200"></td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default CalificacionesPage;