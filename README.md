# 🎓 Gestor Académico Integral (Full-Stack)

[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

**Gestor Académico Full-Stack** 🚀
App con Docker (Node.js, React y PostgreSQL) para el control total del rendimiento escolar. Permite gestionar tareas por criterios de evaluación, calcular notas reales, usar temporizador Pomodoro y predecir el fin de prácticas (FCT) según festivos. Organización profesional con despliegue en un solo comando.

---

## ✨ Características Principales

*   **Gestión por Criterios:** Vincula tareas con Resultados de Aprendizaje (RA) y pesos porcentuales.
*   **Módulo de Prácticas (FCT):** Predicción de fecha de fin basada en horas diarias y calendario de festivos.
*   **Modo Estudio:** Temporizador Pomodoro integrado para sesiones de enfoque vinculadas a asignaturas.
*   **Seguimiento Proactivo:** Flujo de estados de tareas (Abierta, Entregada, Corregida) y sistema de notificaciones.
*   **Dockerizado:** Arquitectura de microservicios lista para producción.

---

## 📸 Vista Previa

> [!IMPORTANT]
> Sustituye las rutas de abajo por tus capturas reales una vez las subas a tu repositorio en una carpeta llamada `screenshots`.

| Dashboard Principal | Temporizador Pomodoro |
| :---: | :---: |
| ![Dashboard](./screenshots/dashboard.png) | ![Pomodoro](./screenshots/pomodoro.png) |

---

## 🚀 Instalación y Despliegue

### Requisitos previos
*   **Docker Desktop** instalado y en ejecución.

### Pasos para arrancar

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/Zynrir/App-Gestor-Acad-mico.git](https://github.com/Zynrir/App-Gestor-Acad-mico.git)
   cd App-Gestor-Acad-mico

## **Levantar la aplicación con Docker:**

```bash
docker-compose up --build
```
## Acceso a la plataforma:

Frontend (App): http://localhost:80

Backend (API): http://localhost:3000

🔑 Variables de Entorno
El sistema utiliza las siguientes variables para la conexión y el servidor:
Variable,Descripción,Ejemplo
DB_USER,Usuario de la base de datos PostgreSQL,admin_instituto
DB_PASSWORD,Contraseña para la base de datos,tu_password_segura
DB_NAME,Nombre de la base de datos,instituto_db
PORT,Puerto donde correrá el backend,3000

🛠️ Tecnologías utilizadas
Frontend: React, Tailwind CSS, Axios.

Backend: Node.js, Express.

Base de Datos: PostgreSQL (inicializada vía init.sql).

Infraestructura: Docker, Docker Compose, Nginx.
