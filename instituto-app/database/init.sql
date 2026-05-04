-- =================================================================
-- SCRIPT DE CREACIÓN DE LA BASE DE DATOS PARA LA APP DE ORGANIZACIÓN
-- BASE DE DATOS: PostgreSQL
-- =================================================================

-- 1. ENUMS (Restricciones de datos)
-- Definimos los tipos de datos enumerados para estados y tipos de actividad
CREATE TYPE tipo_actividad AS ENUM ('Tarea', 'Examen Teorico', 'Examen Practico', 'Proyecto', 'Otro');
CREATE TYPE estado_actividad AS ENUM ('Abierta', 'Sin hacer', 'Terminar', 'A falta de entrega', 'Entregada', 'A falta de correccion', 'Corregida');
CREATE TYPE prioridad_actividad AS ENUM ('Baja', 'Media', 'Alta');

-- 2. TABLA USUARIOS
-- Tabla para registrar al usuario de la aplicación
CREATE TABLE Usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA ASIGNATURAS
-- Almacena las asignaturas del usuario
CREATE TABLE Asignaturas (
    id_asignatura SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    codigo VARCHAR(20) UNIQUE,
    curso_academico VARCHAR(10),
    color_identificacion VARCHAR(7) DEFAULT '#007bff', -- Ejemplo de color HEX
    UNIQUE (id_usuario, nombre) -- El usuario no puede tener dos asignaturas con el mismo nombre
);

-- 4. TABLA RESULTADOS DE APRENDIZAJE (RA)
-- Almacena los Resultados de Aprendizaje y su peso en la asignatura
CREATE TABLE Resultados_Aprendizaje (
    id_ra SERIAL PRIMARY KEY,
    id_asignatura INT NOT NULL REFERENCES Asignaturas(id_asignatura) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    -- Peso entre 0.00 y 1.00 (ej. 0.20 para 20%)
    peso_porcentual NUMERIC(4, 2) NOT NULL CHECK (peso_porcentual BETWEEN 0.00 AND 1.00),
    UNIQUE (id_asignatura, nombre)
);

-- 5. TABLA CRITERIOS DE EVALUACIÓN
-- Almacena los criterios específicos que componen cada RA
CREATE TABLE Criterios_Evaluacion (
    id_criterio SERIAL PRIMARY KEY,
    id_ra INT NOT NULL REFERENCES Resultados_Aprendizaje(id_ra) ON DELETE CASCADE,
    codigo VARCHAR(20) NOT NULL, -- Ej: 1.a, 2.b
    descripcion TEXT NOT NULL,
    UNIQUE (id_ra, codigo)
);

-- 6. TABLA ACTIVIDADES (TAREAS, EXÁMENES, PROYECTOS)
-- Almacena todas las actividades con fechas y estado de flujo de trabajo
CREATE TABLE Actividades (
    id_actividad SERIAL PRIMARY KEY,
    id_asignatura INT NOT NULL REFERENCES Asignaturas(id_asignatura) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    tipo tipo_actividad NOT NULL,
    estado estado_actividad NOT NULL,
    prioridad prioridad_actividad DEFAULT 'Media',
    fecha_limite TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    fecha_optima TIMESTAMP WITHOUT TIME ZONE,
    -- Restricción: La fecha óptima no puede ser posterior a la fecha límite
    CHECK (fecha_optima IS NULL OR fecha_optima <= fecha_limite)
);

-- 7. TABLA CRITERIOS_ACTIVIDAD (Tabla de Unión N:N)
-- Define qué criterios específicos se evalúan en cada actividad
CREATE TABLE Criterios_Actividad (
    id_criterio_actividad SERIAL PRIMARY KEY,
    id_criterio INT NOT NULL REFERENCES Criterios_Evaluacion(id_criterio) ON DELETE CASCADE,
    id_actividad INT NOT NULL REFERENCES Actividades(id_actividad) ON DELETE CASCADE,
    puntuacion_maxima NUMERIC(5, 2) NOT NULL CHECK (puntuacion_maxima > 0), -- Ej: 10.00, 100.00
    UNIQUE (id_criterio, id_actividad) -- Un criterio solo puede evaluarse una vez por actividad
);

-- 8. TABLA CALIFICACIONES
-- Almacena la nota real obtenida para un Criterio en una Actividad
CREATE TABLE Calificaciones (
    id_calificacion SERIAL PRIMARY KEY,
    id_criterio_actividad INT NOT NULL REFERENCES Criterios_Actividad(id_criterio_actividad) ON DELETE CASCADE,
    -- La nota obtenida debe ser menor o igual a la puntuación máxima de ese criterio en la actividad
    nota_obtenida NUMERIC(5, 2) NOT NULL,
    fecha_registro TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. TABLA NOTIFICACIONES (Para el módulo de notificaciones proactivas)
-- Almacena las alertas que el sistema genera para mostrar en la interfaz
CREATE TABLE Notificaciones (
    id_notificacion SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    id_actividad INT REFERENCES Actividades(id_actividad) ON DELETE SET NULL, -- Puede referenciar una actividad o ser general
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50), -- Ej: 'Alerta', 'Recordatorio', 'Accion'
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. TABLA POMODORO_SESIONES (Para el módulo Modo Estudio)
-- Registra las sesiones de estudio realizadas
CREATE TABLE Pomodoro_Sesiones (
    id_sesion SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    id_asignatura INT REFERENCES Asignaturas(id_asignatura) ON DELETE SET NULL, -- Opcional: registrar a qué se dedicó el tiempo
    duracion_estudio_minutos INT NOT NULL,
    duracion_descanso_minutos INT,
    fecha_inicio TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- NUEVAS TABLAS PARA EL MÓDULO DE PRÁCTICAS (FCT)
-- =================================================================

-- 11. TABLA PRACTICAS_AJUSTES
-- Almacena la configuración de horas para el módulo de prácticas de cada usuario
CREATE TABLE Practicas_Ajustes (
    id_usuario INT PRIMARY KEY REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    horas_totales INT DEFAULT 504,
    horas_diarias NUMERIC(4,2) DEFAULT 8.00,
    horas_realizadas NUMERIC(6,2) DEFAULT 0.00
);

-- 12. TABLA FESTIVOS
-- Registra los días festivos locales/nacionales para excluirlos del cálculo de la fecha de fin
CREATE TABLE Festivos (
    fecha DATE PRIMARY KEY,
    descripcion VARCHAR(100) NOT NULL
);