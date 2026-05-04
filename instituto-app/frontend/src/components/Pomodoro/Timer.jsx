// frontend/src/components/Pomodoro/Timer.jsx
import React, { useState, useEffect } from 'react';

const Timer = () => {
    // Configuración por defecto (en minutos)
    const [config, setConfig] = useState({
        focus: 25,
        shortBreak: 5,
        longBreak: 15
    });

    const [mode, setMode] = useState('focus'); // 'focus', 'shortBreak', 'longBreak'
    const [timeLeft, setTimeLeft] = useState(config.focus * 60);
    const [isActive, setIsActive] = useState(false);
    const [cycles, setCycles] = useState(0);

    // Efecto para la cuenta atrás
    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            // Cuando el tiempo termina
            setIsActive(false);
            handleTimerComplete();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const handleTimerComplete = () => {
        // Reproducir sonido (opcional)
        alert("¡Tiempo terminado!"); // Notificación simple por ahora

        if (mode === 'focus') {
            const newCycles = cycles + 1;
            setCycles(newCycles);
            if (newCycles % 4 === 0) {
                switchMode('longBreak');
            } else {
                switchMode('shortBreak');
            }
        } else {
            switchMode('focus');
        }
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setTimeLeft(config[newMode] * 60);
        setIsActive(false);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(config[mode] * 60);
    };

    // Estilos dinámicos según el modo
    const getBgColor = () => {
        if (mode === 'focus') return 'bg-red-500';
        if (mode === 'shortBreak') return 'bg-green-500';
        return 'bg-blue-500';
    };

    return (
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
            {/* Botones superiores de modo */}
            <div className="flex justify-center space-x-2 mb-8">
                <button 
                    onClick={() => switchMode('focus')}
                    className={`px-4 py-1 rounded-full text-sm font-semibold transition-colors ${mode === 'focus' ? 'bg-red-100 text-red-600' : 'text-gray-500'}`}
                >
                    Estudio
                </button>
                <button 
                    onClick={() => switchMode('shortBreak')}
                    className={`px-4 py-1 rounded-full text-sm font-semibold transition-colors ${mode === 'shortBreak' ? 'bg-green-100 text-green-600' : 'text-gray-500'}`}
                >
                    Descanso Corto
                </button>
                <button 
                    onClick={() => switchMode('longBreak')}
                    className={`px-4 py-1 rounded-full text-sm font-semibold transition-colors ${mode === 'longBreak' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
                >
                    Descanso Largo
                </button>
            </div>

            {/* El Reloj Gigante */}
            <div className={`text-center mb-8 p-10 rounded-3xl text-white transition-colors duration-500 ${getBgColor()}`}>
                <div className="text-8xl font-bold font-mono tracking-tighter">
                    {formatTime(timeLeft)}
                </div>
                <p className="mt-2 text-lg opacity-90 font-medium uppercase tracking-widest">
                    {mode === 'focus' ? 'Hora de concentrarse' : 'Tiempo de relax'}
                </p>
            </div>

            {/* Controles */}
            <div className="flex justify-center space-x-4">
                <button 
                    onClick={toggleTimer}
                    className={`px-8 py-3 rounded-xl font-bold text-xl text-white shadow-lg transform transition active:scale-95 ${isActive ? 'bg-gray-400' : getBgColor()}`}
                >
                    {isActive ? 'PAUSAR' : 'EMPEZAR'}
                </button>
                <button 
                    onClick={resetTimer}
                    className="px-6 py-3 rounded-xl font-bold text-xl text-gray-500 bg-gray-100 hover:bg-gray-200"
                >
                    ↺
                </button>
            </div>

            {/* Contador de ciclos */}
            <div className="mt-8 text-center text-gray-400 text-sm">
                Ciclos completados hoy: <span className="font-bold text-gray-800">{cycles}</span>
            </div>
        </div>
    );
};

export default Timer;