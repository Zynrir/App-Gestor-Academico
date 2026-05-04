import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const EstudioPage = () => {
    // Estados del Temporizador
    const [minutos, setMinutos] = useState(25);
    const [segundos, setSegundos] = useState(0);
    const [activo, setActivo] = useState(false);
    const [modo, setModo] = useState('FOCUS'); // 'FOCUS', 'CORTO', 'LARGO'

    // Estados de Datos
    const [tareas, setTareas] = useState([]);
    const [tareaSeleccionada, setTareaSeleccionada] = useState('');
    const [asignaturas, setAsignaturas] = useState([]);

    useEffect(() => {
        // Cargar asignaturas primero para poder mostrar el nombre de la asignatura en el selector
        axiosClient.get('/asignaturas/usuario/1')
            .then(res => setAsignaturas(res.data))
            .catch(console.error);

        // Cargar tareas pendientes
        axiosClient.get('/tareas/usuario/1')
            .then(res => {
                // FILTRO CORREGIDO: Usamos los estados reales de tu BD
                // Queremos ver todo lo que NO esté finalizado
                const estadosPendientes = ['Sin hacer', 'Abierta', 'Terminar', 'A falta de entrega'];
                
                const pendientes = res.data.filter(t => estadosPendientes.includes(t.estado));
                setTareas(pendientes);
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        let intervalo = null;
        if (activo) {
            intervalo = setInterval(() => {
                if (segundos === 0) {
                    if (minutos === 0) {
                        setActivo(false);
                        alert("¡Tiempo terminado! ⏰");
                        return;
                    }
                    setMinutos(minutos - 1);
                    setSegundos(59);
                } else {
                    setSegundos(segundos - 1);
                }
            }, 1000);
        } else {
            clearInterval(intervalo);
        }
        return () => clearInterval(intervalo);
    }, [activo, minutos, segundos]);

    // Funciones de control
    const cambiarModo = (nuevoModo) => {
        setActivo(false);
        setModo(nuevoModo);
        setSegundos(0);
        if (nuevoModo === 'FOCUS') setMinutos(25);
        if (nuevoModo === 'CORTO') setMinutos(5);
        if (nuevoModo === 'LARGO') setMinutos(15);
    };

    const toggleTimer = () => setActivo(!activo);
    
    const resetTimer = () => {
        setActivo(false);
        setSegundos(0);
        if (modo === 'FOCUS') setMinutos(25);
        else if (modo === 'CORTO') setMinutos(5);
        else setMinutos(15);
    };

    // Estilos dinámicos según el modo
    const getThemeColor = () => {
        if (modo === 'FOCUS') return 'bg-indigo-600';
        if (modo === 'CORTO') return 'bg-green-500';
        return 'bg-blue-500';
    };

    // Helper para obtener nombre de asignatura
    const getNombreAsignatura = (idAsignatura) => {
        const asig = asignaturas.find(a => a.id_asignatura === idAsignatura);
        return asig ? asig.nombre : 'General';
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
            <div className="w-full max-w-md px-4 mb-8">
                <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Modo Estudio</h1>
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">¿En qué vas a trabajar?</label>
                    <select 
                        value={tareaSeleccionada}
                        onChange={(e) => setTareaSeleccionada(e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    >
                        <option value="">-- Selecciona una tarea --</option>
                        {tareas.map(t => (
                            <option key={t.id_tarea} value={t.id_tarea}>
                                {/* CORREGIDO: Usamos t.titulo y buscamos el nombre de la asignatura */}
                                {getNombreAsignatura(t.id_asignatura)} - {t.titulo}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md text-center">
                <div className="flex justify-center space-x-2 mb-8 bg-gray-100 p-1 rounded-xl">
                    <button onClick={() => cambiarModo('FOCUS')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${modo === 'FOCUS' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Focus (25m)</button>
                    <button onClick={() => cambiarModo('CORTO')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${modo === 'CORTO' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'}`}>Descanso Corto</button>
                    <button onClick={() => cambiarModo('LARGO')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${modo === 'LARGO' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Descanso Largo</button>
                </div>

                <div className={`text-9xl font-bold mb-8 transition-colors duration-500 font-mono tracking-tighter ${modo === 'FOCUS' ? 'text-indigo-600' : modo === 'CORTO' ? 'text-green-500' : 'text-blue-500'}`}>
                    {minutos}:{segundos < 10 ? `0${segundos}` : segundos}
                </div>

                <div className="mb-8 text-xl font-medium text-gray-600 h-8 overflow-hidden">
                    {activo ? (
                        tareaSeleccionada 
                            ? <span className="animate-pulse">Trabajando en: <strong>{tareas.find(t => t.id_tarea == tareaSeleccionada)?.titulo}</strong></span> 
                            : '¡Concéntrate!'
                    ) : '¿Listo para empezar?'}
                </div>

                <div className="flex justify-center space-x-4">
                    <button onClick={toggleTimer} className={`px-8 py-4 rounded-2xl text-white text-xl font-bold shadow-lg transform transition active:scale-95 ${getThemeColor()} hover:opacity-90`}>{activo ? 'PAUSA' : 'EMPEZAR'}</button>
                    <button onClick={resetTimer} className="px-6 py-4 rounded-2xl bg-gray-200 text-gray-600 text-xl font-bold hover:bg-gray-300 transition">↻</button>
                </div>
            </div>
        </div>
    );
};

export default EstudioPage;