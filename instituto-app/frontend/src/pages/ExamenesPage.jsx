import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const ExamenesPage = () => {
    const [fechaActual, setFechaActual] = useState(new Date());
    const [examenes, setExamenes] = useState([]);
    const [asignaturas, setAsignaturas] = useState([]);
    
    // Modal
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        titulo: '',
        id_asignatura: '',
        tipo: 'Examen Teorico', // Valor por defecto del ENUM
        fecha: '',
        // descripcion: '' -> Eliminado porque Actividades no tiene descripcion simple
    });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const resAsig = await axiosClient.get('/asignaturas/usuario/1');
            setAsignaturas(resAsig.data);
            const resExamenes = await axiosClient.get('/examenes/usuario/1');
            setExamenes(resExamenes.data);
        } catch (error) {
            console.error("Error cargando datos:", error);
        }
    };

    // --- LÓGICA DEL CALENDARIO ---
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const getDiasEnMes = (mes, anio) => new Date(anio, mes + 1, 0).getDate();
    const getPrimerDiaMes = (mes, anio) => {
        let dia = new Date(anio, mes, 1).getDay();
        return dia === 0 ? 6 : dia - 1; 
    };

    const cambiarMes = (direccion) => {
        setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + direccion, 1));
    };

    const handleDiaClick = (dia) => {
        const mesStr = (fechaActual.getMonth() + 1).toString().padStart(2, '0');
        const diaStr = dia.toString().padStart(2, '0');
        const fechaStr = `${fechaActual.getFullYear()}-${mesStr}-${diaStr}`;
        
        setFormData({ ...formData, fecha: fechaStr, id_asignatura: asignaturas[0]?.id_asignatura || '' });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post('/examenes', { ...formData });
            setShowModal(false);
            setFormData({ titulo: '', id_asignatura: '', tipo: 'Examen Teorico', fecha: '' });
            cargarDatos();
        } catch (error) {
            alert('Error al guardar examen');
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation(); 
        if(window.confirm("¿Eliminar este examen?")) {
            await axiosClient.delete(`/examenes/${id}`);
            cargarDatos();
        }
    };

    const renderCalendario = () => {
        const diasTotal = getDiasEnMes(fechaActual.getMonth(), fechaActual.getFullYear());
        const primerDiaSemana = getPrimerDiaMes(fechaActual.getMonth(), fechaActual.getFullYear());
        const celdas = [];

        for (let i = 0; i < primerDiaSemana; i++) {
            celdas.push(<div key={`empty-${i}`} className="h-32 bg-gray-50/50 border border-gray-100"></div>);
        }

        for (let dia = 1; dia <= diasTotal; dia++) {
            const fechaCell = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), dia);
            const hoy = new Date();
            const esHoy = fechaCell.toDateString() === hoy.toDateString();

            const examenesDia = examenes.filter(e => {
                const f = new Date(e.fecha);
                return f.getDate() === dia && f.getMonth() === fechaActual.getMonth() && f.getFullYear() === fechaActual.getFullYear();
            });

            celdas.push(
                <div 
                    key={dia} 
                    onClick={() => handleDiaClick(dia)}
                    className={`h-32 border border-gray-100 p-2 relative group hover:bg-blue-50 transition cursor-pointer overflow-hidden ${esHoy ? 'bg-blue-50/30' : 'bg-white'}`}
                >
                    <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${esHoy ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                        {dia}
                    </span>
                    
                    <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                        {examenesDia.map(exa => (
                            <div key={exa.id_examen} className={`text-[10px] p-1.5 rounded border-l-4 shadow-sm relative group/item
                                ${exa.tipo === 'Examen Teorico' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-pink-50 border-pink-500 text-pink-700'}`}>
                                <button 
                                    onClick={(e) => handleDelete(e, exa.id_examen)}
                                    className="absolute top-0.5 right-0.5 text-red-400 hover:text-red-600 hidden group-hover/item:block bg-white rounded px-1"
                                >
                                    ×
                                </button>
                                <div className="font-bold truncate">{exa.asignatura_nombre}</div>
                                <div className="truncate">{exa.titulo}</div>
                            </div>
                        ))}
                    </div>

                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition">
                        <span className="text-blue-400 text-xl font-bold">+</span>
                    </div>
                </div>
            );
        }
        return celdas;
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">📅 Calendario de Exámenes</h1>
                
                <div className="flex items-center gap-4 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                    <button onClick={() => cambiarMes(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 font-bold">←</button>
                    <span className="text-lg font-bold text-gray-800 w-40 text-center">
                        {meses[fechaActual.getMonth()]} {fechaActual.getFullYear()}
                    </span>
                    <button onClick={() => cambiarMes(1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 font-bold">→</button>
                </div>
            </div>

            <div className="grid grid-cols-7 bg-slate-800 text-white rounded-t-xl overflow-hidden">
                {diasSemana.map(d => (
                    <div key={d} className="py-3 text-center text-sm font-bold uppercase tracking-wider">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 bg-gray-200 gap-px border border-gray-200 shadow-lg rounded-b-xl overflow-hidden">
                {renderCalendario()}
            </div>

            <div className="flex gap-4 mt-6 text-xs font-bold text-gray-500 justify-end">
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-purple-500 rounded-full"></span> Examen Teórico</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-pink-500 rounded-full"></span> Examen Práctico</div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Nuevo Examen</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Asignatura</label>
                                <select 
                                    className="w-full p-2 border rounded-lg bg-gray-50"
                                    value={formData.id_asignatura}
                                    onChange={e => setFormData({...formData, id_asignatura: e.target.value})}
                                    required
                                >
                                    <option value="">Selecciona...</option>
                                    {asignaturas.map(a => <option key={a.id_asignatura} value={a.id_asignatura}>{a.nombre}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Título / Tema</label>
                                <input className="w-full p-2 border rounded-lg" value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} placeholder="Ej: Parcial Tema 1-4" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Tipo</label>
                                    {/* IMPORTANTE: Los values coinciden con tu ENUM de SQL */}
                                    <select 
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.tipo}
                                        onChange={e => setFormData({...formData, tipo: e.target.value})}
                                    >
                                        <option value="Examen Teorico">Teórico</option>
                                        <option value="Examen Practico">Práctico</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Fecha</label>
                                    <input type="date" className="w-full p-2 border rounded-lg" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} required />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamenesPage;