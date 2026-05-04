import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useLocation, Link } from 'react-router-dom';

const TareasPage = () => {
    const [asignaturas, setAsignaturas] = useState([]);
    const [selectedAsignatura, setSelectedAsignatura] = useState('');
    const [tareas, setTareas] = useState([]);
    const [isDashboardMode, setIsDashboardMode] = useState(false);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingTarea, setEditingTarea] = useState(null);
    
    const [formData, setFormData] = useState({
        titulo: '',
        fecha_optima: '',
        fecha_limite: '',
        estado: 'Sin hacer',
        criterios_ids: [] 
    });

    const [criteriosDisponibles, setCriteriosDisponibles] = useState([]);
    const location = useLocation();

    // Estados que consideramos "Finalizados" (ya no requieren acción del alumno)
    const estadosFinalizados = ['Entregada', 'A falta de correccion', 'Corregida'];

    // 1. Cargar Asignaturas
    useEffect(() => {
        axiosClient.get('/asignaturas/usuario/1')
            .then(res => {
                setAsignaturas(res.data);
                const searchParams = new URLSearchParams(location.search);
                const idUrl = searchParams.get('asignatura');
                if (idUrl) {
                    setSelectedAsignatura(idUrl);
                    setIsDashboardMode(true);
                } else {
                    setIsDashboardMode(false);
                }
            })
            .catch(console.error);
    }, [location]);

    // 2. Cargar Tareas
    useEffect(() => {
        if (selectedAsignatura) {
            fetchTareas();
            fetchCriteriosAsignatura();
        } else {
            setTareas([]);
            setCriteriosDisponibles([]);
        }
    }, [selectedAsignatura]);

    // --- LÓGICA INTELIGENTE DE CARGA ---
    const fetchTareas = () => {
        axiosClient.get('/tareas/usuario/1')
            .then(res => {
                const filtradas = res.data.filter(t => t.id_asignatura === parseInt(selectedAsignatura));
                
                const tareasConPrioridad = filtradas.map(t => {
                    // Si la tarea ya está entregada o corregida, NO calculamos prioridad
                    if (estadosFinalizados.includes(t.estado)) {
                        return { ...t, prioridadAuto: 'Completada', diasRestantes: 0 };
                    }

                    // Si está pendiente, calculamos urgencia
                    const hoy = new Date();
                    hoy.setHours(0, 0, 0, 0);
                    
                    const fOptima = t.fecha_optima ? new Date(t.fecha_optima) : null;
                    const fLimite = new Date(t.fecha_limite);
                    
                    const fechaRef = (fOptima && fOptima >= hoy) ? fOptima : fLimite;
                    const diffMS = fechaRef.getTime() - hoy.getTime();
                    const dias = Math.ceil(diffMS / (1000 * 60 * 60 * 24));

                    let autoPrioridad = 'Baja';
                    if (dias <= 3) autoPrioridad = 'Alta';
                    else if (dias <= 7) autoPrioridad = 'Media';

                    return { ...t, prioridadAuto: autoPrioridad, diasRestantes: dias };
                });

                // Ordenamos: Alta > Media > Baja > Completada
                tareasConPrioridad.sort((a, b) => {
                    const peso = { 'Alta': 1, 'Media': 2, 'Baja': 3, 'Completada': 4 };
                    return peso[a.prioridadAuto] - peso[b.prioridadAuto] || a.diasRestantes - b.diasRestantes;
                });

                setTareas(tareasConPrioridad);
            })
            .catch(console.error);
    };

    const fetchCriteriosAsignatura = () => {
        axiosClient.get(`/tareas/criterios-asignatura/${selectedAsignatura}`)
            .then(res => setCriteriosDisponibles(res.data))
            .catch(console.error);
    };

    const getEstadoInfo = (estado) => {
        switch(estado) {
            case 'Abierta': return { label: 'En curso', color: 'bg-blue-100 text-blue-700 border-blue-200' };
            case 'Sin hacer': return { label: 'Sin empezar', color: 'bg-slate-100 text-slate-600 border-slate-200' };
            case 'Terminar': return { label: 'Casi lista', color: 'bg-orange-100 text-orange-700 border-orange-200' };
            case 'A falta de entrega': return { label: 'Pendiente entrega', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
            case 'Entregada': return { label: 'Entregada', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
            case 'A falta de correccion': return { label: 'Esperando nota', color: 'bg-indigo-50 text-indigo-600 border-indigo-200' };
            case 'Corregida': return { label: 'Finalizada', color: 'bg-purple-100 text-purple-700 border-purple-200' };
            default: return { label: estado, color: 'bg-gray-100' };
        }
    };

    const handleOpenModal = (tarea = null) => {
        if (tarea) {
            setEditingTarea(tarea);
            setFormData({
                titulo: tarea.titulo,
                fecha_optima: tarea.fecha_optima ? tarea.fecha_optima.split('T')[0] : '',
                fecha_limite: tarea.fecha_limite ? tarea.fecha_limite.split('T')[0] : '',
                estado: tarea.estado,
                criterios_ids: tarea.criterios_ids || []
            });
        } else {
            setEditingTarea(null);
            setFormData({ titulo: '', fecha_optima: '', fecha_limite: '', estado: 'Sin hacer', criterios_ids: [] });
        }
        setShowModal(true);
    };

    const handleCriterioToggle = (id_criterio) => {
        setFormData(prev => {
            const existe = prev.criterios_ids.includes(id_criterio);
            return {
                ...prev,
                criterios_ids: existe 
                    ? prev.criterios_ids.filter(id => id !== id_criterio)
                    : [...prev.criterios_ids, id_criterio]
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, prioridad: 'Media', id_asignatura: selectedAsignatura, id_usuario: 1 };
            if (editingTarea) {
                await axiosClient.put(`/tareas/${editingTarea.id_tarea}`, payload);
            } else {
                await axiosClient.post('/tareas', payload);
            }
            setShowModal(false);
            fetchTareas();
        } catch (error) {
            alert('Error al guardar la tarea.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Borrar esta tarea?')) {
            try {
                await axiosClient.delete(`/tareas/${id}`);
                fetchTareas();
            } catch (error) {
                alert('Error al eliminar');
            }
        }
    };

    const gruposCriterios = criteriosDisponibles.reduce((acc, c) => {
        if (!acc[c.ra_nombre]) acc[c.ra_nombre] = [];
        acc[c.ra_nombre].push(c);
        return acc;
    }, {});

    const currentAsignatura = asignaturas.find(a => a.id_asignatura == selectedAsignatura);

    return (
        <div className="max-w-6xl mx-auto p-6">
            
            {!selectedAsignatura ? (
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Tareas</h1>
                    <p className="text-gray-500 mb-8">Selecciona una asignatura.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {asignaturas.map((asig) => (
                            <div key={asig.id_asignatura} onClick={() => setSelectedAsignatura(asig.id_asignatura)} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer border border-gray-100 group">
                                <div className="h-2 w-full" style={{ backgroundColor: asig.color_identificacion || '#3B82F6' }}></div>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{asig.nombre}</h3>
                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-semibold mt-2 inline-block">{asig.curso_academico}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4">
                        <div>
                            {isDashboardMode ? (
                                <Link to="/" className="text-sm text-gray-500 hover:text-blue-600 mb-1 flex items-center gap-1">← Panel Principal</Link>
                            ) : (
                                <button onClick={() => setSelectedAsignatura('')} className="text-sm text-gray-500 hover:text-blue-600 mb-1 flex items-center gap-1">← Cambiar Asignatura</button>
                            )}
                            <h1 className="text-3xl font-bold text-gray-900">{currentAsignatura?.nombre}</h1>
                        </div>
                        <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition font-bold mt-4 md:mt-0">+ Nueva Tarea</button>
                    </div>

                    <div className="grid gap-4">
                        {tareas.map(t => {
                            const infoEstado = getEstadoInfo(t.estado);
                            // Verificamos si es "activo" para mostrar prioridad
                            const esFinalizado = estadosFinalizados.includes(t.estado);
                            const esAlta = !esFinalizado && t.prioridadAuto === 'Alta';
                            const esMedia = !esFinalizado && t.prioridadAuto === 'Media';

                            return (
                                <div key={t.id_tarea} className={`bg-white p-5 rounded-xl shadow-sm border transition flex flex-col sm:flex-row justify-between items-center gap-4 hover:shadow-md ${esAlta ? 'border-l-4 border-l-red-500 ring-1 ring-red-50' : 'border-gray-100'}`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className={`font-bold text-lg ${esFinalizado ? 'text-gray-500' : 'text-gray-800'}`}>{t.titulo}</h3>
                                            
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-black uppercase ${infoEstado.color}`}>
                                                {infoEstado.label}
                                            </span>
                                            
                                            {/* ETIQUETAS DE PRIORIDAD (Solo si NO está finalizada) */}
                                            {esAlta && <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-black uppercase animate-pulse">🔥 Alta</span>}
                                            {esMedia && <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded font-black uppercase">Media</span>}
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-3">
                                            {t.fecha_optima && <span className={`text-xs px-2 py-1 rounded font-medium ${esFinalizado ? 'text-gray-400 bg-gray-50' : 'text-emerald-600 bg-emerald-50'}`}>🎯 Óptima: {new Date(t.fecha_optima).toLocaleDateString()}</span>}
                                            {t.fecha_limite && <span className={`text-xs px-2 py-1 rounded font-bold ${esFinalizado ? 'text-gray-400 bg-gray-50' : 'text-rose-600 bg-rose-50'}`}>⚠️ Límite: {new Date(t.fecha_limite).toLocaleDateString()}</span>}
                                            <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded font-medium">🎯 {t.criterios_ids?.length || 0} Criterios</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleOpenModal(t)} className="p-2 hover:bg-blue-50 rounded-full transition text-blue-600">✏️</button>
                                        <button onClick={() => handleDelete(t.id_tarea)} className="p-2 hover:bg-red-50 rounded-full transition text-red-600">🗑️</button>
                                    </div>
                                </div>
                            );
                        })}
                        {tareas.length === 0 && <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-medium">No has creado tareas todavía.</div>}
                    </div>
                </>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6 text-slate-800 border-b pb-4">{editingTarea ? 'Editar Tarea' : 'Crear Nueva Tarea'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Título de la Tarea</label>
                                    <input className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none transition-all font-medium" value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} required placeholder="Ej: Práctica Final de Redes" />
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Estado del Flujo</label>
                                    <select className="w-full p-3 border-2 border-slate-100 rounded-xl bg-slate-50 font-bold text-slate-700 outline-none focus:border-blue-500" value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})}>
                                        <option value="Sin hacer">🔴 Sin empezar</option>
                                        <option value="Abierta">🔵 Abierta / En curso</option>
                                        <option value="Terminar">🟠 Por terminar</option>
                                        <option value="A falta de entrega">🟡 Falta entregar</option>
                                        <option value="Entregada">🟢 Entregada</option>
                                        <option value="A falta de correccion">⚪ Falta corrección</option>
                                        <option value="Corregida">🟣 Corregida</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <div>
                                    <label className="block text-xs font-black text-emerald-600 uppercase mb-2">Fecha Óptima</label>
                                    <input type="date" className="w-full p-2 border-2 border-white rounded-lg outline-none focus:border-emerald-500 transition-all font-bold text-emerald-700" value={formData.fecha_optima} onChange={e => setFormData({...formData, fecha_optima: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-rose-600 uppercase mb-2">Fecha Límite</label>
                                    <input type="date" className="w-full p-2 border-2 border-white rounded-lg outline-none focus:border-rose-500 transition-all font-bold text-rose-700" value={formData.fecha_limite} onChange={e => setFormData({...formData, fecha_limite: e.target.value})} required />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">🎯 Criterios a Evaluar <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{formData.criterios_ids.length}</span></h3>
                                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 h-64 overflow-y-auto space-y-4">
                                    {Object.entries(gruposCriterios).map(([raNombre, criterios]) => (
                                        <div key={raNombre} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                            <h4 className="text-[10px] font-black text-blue-600 mb-3 uppercase tracking-wider border-b pb-2">{raNombre}</h4>
                                            <div className="space-y-2">
                                                {criterios.map(cri => (
                                                    <label key={cri.id_criterio} className="flex items-start gap-3 cursor-pointer group">
                                                        <input type="checkbox" className="mt-1 h-4 w-4 rounded text-blue-600 border-slate-300" checked={formData.criterios_ids.includes(cri.id_criterio)} onChange={() => handleCriterioToggle(cri.id_criterio)} />
                                                        <span className="text-[11px] text-slate-600 leading-tight"><strong>{cri.codigo}:</strong> {cri.descripcion}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Cancelar</button>
                                <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-black shadow-lg shadow-blue-200 active:scale-95 transition-transform">GUARDAR TAREA</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TareasPage;