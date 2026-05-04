// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Importamos las páginas
import DashboardPage from './pages/DashboardPage';
import EstudioPage from './pages/EstudioPage';
import TareasPage from './pages/TareasPage';
import CalificacionesPage from './pages/CalificacionesPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import ExamenesPage from './pages/ExamenesPage'; 
// --- NUEVO: Importamos la página de Prácticas ---
import PracticasPage from './pages/PracticasPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
        {/* Barra de Navegación Superior */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  {/* Logo / Nombre de la App */}
                  <span className="font-bold text-xl text-blue-600">InstitutoApp</span>
                </div>
                
                {/* ENLACES DEL MENÚ */}
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link to="/" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Dashboard
                  </Link>
                  <Link to="/tareas" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Tareas
                  </Link>
                  <Link to="/calificaciones" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Notas
                  </Link>
                  <Link to="/estudio" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Modo Estudio
                  </Link>
                  <Link to="/examenes" className="border-transparent text-indigo-600 hover:border-indigo-300 hover:text-indigo-800 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-bold">
                    📅 Exámenes
                  </Link>
                  {/* --- NUEVO: Enlace a Prácticas FCT --- */}
                  <Link to="/practicas" className="border-transparent text-emerald-600 hover:border-emerald-300 hover:text-emerald-800 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-bold">
                    💼 Prácticas
                  </Link>
                  <Link to="/configuracion" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    ⚙️ Configuración
                  </Link>
                  {/* ----------------------------------- */}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Contenido Principal */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/estudio" element={<EstudioPage />} />
            <Route path="/tareas" element={<TareasPage />} />
            <Route path="/calificaciones" element={<CalificacionesPage />} />
            <Route path="/configuracion" element={<ConfiguracionPage />} />
            <Route path="/examenes" element={<ExamenesPage />} />
            {/* --- NUEVO: Ruta de Prácticas --- */}
            <Route path="/practicas" element={<PracticasPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;