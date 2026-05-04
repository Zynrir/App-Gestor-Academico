import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import * as XLSX from 'xlsx';

const ConfiguracionPage = () => {
    const [asignaturas, setAsignaturas] = useState([]);
    const [selectedAsignatura, setSelectedAsignatura] = useState('');
    const [estructura, setEstructura] = useState([]);

    const [newAsig, setNewAsig] = useState({ nombre: '', color: '#3B82F6' });
    const [newRa, setNewRa] = useState({ nombre: '', peso: '' });
    const [newCri, setNewCri] = useState({ codigo: '', descripcion: '', peso: '' });
    const [raActivoParaCriterio, setRaActivoParaCriterio] = useState(null);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        cargarAsignaturas();
    }, []);

    useEffect(() => {
        if (selectedAsignatura) cargarEstructura();
        else setEstructura([]);
    }, [selectedAsignatura]);

    const cargarAsignaturas = () => {
        axiosClient.get('/asignaturas/usuario/1')
            .then(res => setAsignaturas(res.data))
            .catch(console.error);
    };

    const cargarEstructura = () => {
        axiosClient.get(`/estructura/${selectedAsignatura}`)
            .then(res => setEstructura(res.data))
            .catch(console.error);
    };

    // --- FUNCIÓN: BORRAR ASIGNATURA ---
    const handleDeleteAsignatura = async () => {
        if (!selectedAsignatura) return;

        const confirmacion = window.confirm(
            "⚠️ ¿ESTÁS SEGURO? \n\nSe borrará la asignatura, sus RAs, sus criterios y todas las notas registradas. Esta acción no se puede deshacer."
        );

        if (confirmacion) {
            try {
                await axiosClient.delete(`/asignaturas/${selectedAsignatura}`);
                alert("Asignatura eliminada correctamente.");
                setSelectedAsignatura(''); 
                cargarAsignaturas(); 
            } catch (err) {
                console.error(err);
                alert("Error al eliminar la asignatura. Verifica la consola.");
            }
        }
    };

    // --- FUNCIÓN: IMPORTAR EXCEL ---
    const handleImportarExcel = (e) => {
        const file = e.target.files[0];
        if (!file || !selectedAsignatura) return;

        setImporting(true);
        const reader = new FileReader();

        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const datosJson = XLSX.utils.sheet_to_json(ws);

                await axiosClient.post('/estructura/importar', {
                    id_asignatura: selectedAsignatura,
                    datos: datosJson
                });

                alert("¡Estructura importada con éxito!");
                cargarEstructura();
            } catch (err) {
                console.error(err);
                alert("Error al importar: Revisa las cabeceras (ra_nombre, ra_peso, cri_codigo, cri_descripcion, cri_peso)");
            } finally {
                setImporting(false);
                e.target.value = null;
            }
        };

        reader.readAsBinaryString(file);
    };

    const handleAddAsignatura = async (e) => {
        e.preventDefault();
        try {
            const res = await axiosClient.post('/asignaturas', {
                nombre: newAsig.nombre,
                curso_academico: '24/25',
                color_identificacion: newAsig.color,
                id_usuario: 1
            });
            setNewAsig({ nombre: '', color: '#3B82F6' });
            cargarAsignaturas();
            setSelectedAsignatura(res.data.id_asignatura);
            alert("Asignatura creada con éxito.");
        } catch (err) { alert("Error al crear la asignatura"); }
    };

    const handleAddRa = async (e) => {
        e.preventDefault();
        try {
            const pesoDecimal = parseFloat(newRa.peso) / 100;
            await axiosClient.post('/estructura/ra', {
                id_asignatura: selectedAsignatura,
                nombre: newRa.nombre,
                peso_porcentual: pesoDecimal
            });
            setNewRa({ nombre: '', peso: '' });
            cargarEstructura();
        } catch (err) { alert("Error al añadir RA"); }
    };

    const handleDeleteRa = async (id) => {
        if (window.confirm("¿Estás seguro? Se borrarán todos los criterios asociados a este RA.")) {
            try {
                await axiosClient.delete(`/estructura/ra/${id}`);
                cargarEstructura();
            } catch (err) { alert("Error al eliminar RA"); }
        }
    };

    const handleAddCriterio = async (e, id_ra) => {
        e.preventDefault();
        try {
            await axiosClient.post('/estructura/criterio', {
                id_ra: id_ra,
                codigo: newCri.codigo,
                descripcion: newCri.descripcion,
                peso_en_ra: newCri.peso
            });
            setNewCri({ codigo: '', descripcion: '', peso: '' });
            setRaActivoParaCriterio(null);
            cargarEstructura();
        } catch (err) { alert("Error al añadir criterio"); }
    };

    const handleDeleteCriterio = async (id) => {
        try {
            await axiosClient.delete(`/estructura/criterio/${id}`);
            cargarEstructura();
        } catch (err) { alert("Error al eliminar el criterio"); }
    };

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-3xl font-extrabold mb-8 text-gray-900 border-b pb-4">Configuración del Curso</h1>

            {/* SECCIÓN 1: CREAR ASIGNATURA */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">📖 Nueva Asignatura</h3>
                <form onSubmit={handleAddAsignatura} className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[250px]">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nombre de la materia</label>
                        <input 
                            placeholder="Ej: Programación de Servicios" 
                            className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newAsig.nombre}
                            onChange={e => setNewAsig({...newAsig, nombre: e.target.value})}
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Color</label>
                        <input 
                            type="color" 
                            className="h-12 w-20 p-1 bg-gray-50 border-none rounded-xl cursor-pointer"
                            value={newAsig.color}
                            onChange={e => setNewAsig({...newAsig, color: e.target.value})}
                        />
                    </div>
                    <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100">Crear Materia</button>
                </form>
            </div>

            {/* SECCIÓN 2: SELECTOR, BORRADO E IMPORTACIÓN */}
            <div className="mb-8">
                <label className="block text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Configurar Contenidos de:</label>
                <div className="flex gap-4">
                    <select 
                        className="flex-1 p-4 border-none rounded-2xl shadow-sm text-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                        value={selectedAsignatura}
                        onChange={(e) => setSelectedAsignatura(e.target.value)}
                    >
                        <option value="">-- Elige una asignatura para editar --</option>
                        {asignaturas.map(a => <option key={a.id_asignatura} value={a.id_asignatura}>{a.nombre}</option>)}
                    </select>

                    {selectedAsignatura && (
                        <button 
                            onClick={handleDeleteAsignatura}
                            className="bg-red-50 text-red-600 border border-red-200 px-6 rounded-2xl font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
                        >
                            🗑️ Borrar
                        </button>
                    )}
                </div>

                {selectedAsignatura && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h4 className="text-blue-800 font-bold text-sm">¿Tienes la programación en Excel?</h4>
                            <p className="text-blue-600 text-xs">Sube el archivo para cargar todos los RAs y criterios de golpe.</p>
                        </div>
                        <input 
                            type="file" 
                            accept=".xlsx, .xls, .csv" 
                            onChange={handleImportarExcel}
                            className="text-xs text-blue-800 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                            disabled={importing}
                        />
                    </div>
                )}
            </div>

            {selectedAsignatura && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-gray-900 p-6 rounded-2xl shadow-xl text-white">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-400">⚡ Nuevo Resultado de Aprendizaje (RA)</h3>
                        <form onSubmit={handleAddRa} className="flex gap-3">
                            <input 
                                placeholder="Nombre (ej: RA1: Despliegue de artefactos)" 
                                className="flex-1 p-3 bg-gray-800 border-none rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500"
                                value={newRa.nombre}
                                onChange={e => setNewRa({...newRa, nombre: e.target.value})}
                                required 
                            />
                            <input 
                                type="number" placeholder="Peso %" 
                                className="w-24 p-3 bg-gray-800 border-none rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500 text-center"
                                value={newRa.peso}
                                onChange={e => setNewRa({...newRa, peso: e.target.value})}
                                required 
                            />
                            <button type="submit" className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-400 transition text-sm">Añadir RA</button>
                        </form>
                    </div>

                    <div className="space-y-6">
                        {estructura.map(ra => (
                            <div key={ra.id_ra} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-lg font-bold text-gray-800">{ra.nombre}</h2>
                                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">Peso: {(ra.peso_porcentual * 100).toFixed(0)}%</span>
                                    </div>
                                    <button onClick={() => handleDeleteRa(ra.id_ra)} className="text-gray-300 hover:text-red-500 transition-colors">🗑️</button>
                                </div>

                                <div className="p-6">
                                    <div className="space-y-3 mb-6">
                                        {ra.criterios.map(cri => (
                                            <div key={cri.id_criterio} className="group flex justify-between items-center p-3 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100">
                                                <div className="flex gap-4 items-center">
                                                    <span className="bg-white shadow-sm border border-gray-200 text-gray-700 text-[10px] font-black px-2 py-1 rounded-lg w-8 text-center">{cri.codigo}</span>
                                                    <span className="text-gray-600 text-sm">{cri.descripcion}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs font-bold text-blue-500">{cri.peso_en_ra}%</span>
                                                    <button onClick={() => handleDeleteCriterio(cri.id_criterio)} className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 transition-all text-xs">Borrar</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <form onSubmit={(e) => handleAddCriterio(e, ra.id_ra)} className="bg-blue-50/50 p-4 rounded-2xl border border-dashed border-blue-200">
                                        <div className="flex gap-3">
                                            <input 
                                                placeholder="Cód" 
                                                className="w-20 p-2 bg-white border-none rounded-lg text-sm outline-none"
                                                value={raActivoParaCriterio === ra.id_ra ? newCri.codigo : ''}
                                                onFocus={() => setRaActivoParaCriterio(ra.id_ra)}
                                                onChange={e => setNewCri({...newCri, codigo: e.target.value})}
                                                required
                                            />
                                            <input 
                                                placeholder="Descripción..." 
                                                className="flex-1 p-2 bg-white border-none rounded-lg text-sm outline-none"
                                                value={raActivoParaCriterio === ra.id_ra ? newCri.descripcion : ''}
                                                onFocus={() => setRaActivoParaCriterio(ra.id_ra)}
                                                onChange={e => setNewCri({...newCri, descripcion: e.target.value})}
                                                required
                                            />
                                            <input 
                                                type="number" placeholder="%" 
                                                className="w-16 p-2 bg-white border-none rounded-lg text-sm outline-none text-center"
                                                value={raActivoParaCriterio === ra.id_ra ? newCri.peso : ''}
                                                onFocus={() => setRaActivoParaCriterio(ra.id_ra)}
                                                onChange={e => setNewCri({...newCri, peso: e.target.value})}
                                                required
                                            />
                                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm">+</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConfiguracionPage;