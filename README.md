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

<img width="1918" height="824" alt="Dashboard" src="https://github.com/user-attachments/assets/d35a0b45-f3b1-47e9-8177-eea4fe115e60" />

---

<img width="1912" height="764" alt="Pagina_Tareas" src="https://github.com/user-attachments/assets/3c04089b-f954-4122-b4b9-0ebe7faf3d54" />

---

<img width="1903" height="913" alt="Pagina_Practicas" src="https://github.com/user-attachments/assets/961f4c4a-fd89-4812-8384-e5fa4ba265b8" />

---

<img width="1900" height="815" alt="Pagina_Pomodoro" src="https://github.com/user-attachments/assets/49465d29-e45d-4b26-9ef5-04e094648714" />

---

<img width="1916" height="788" alt="Pagina_Notas" src="https://github.com/user-attachments/assets/56438a00-6951-4bd6-a2a9-7ea61b20b8c1" />

---

<img width="1919" height="805" alt="Pagina_Configuracion" src="https://github.com/user-attachments/assets/cb4ba074-64f4-4715-a957-0dd3336607b9" />

---

<img width="1900" height="804" alt="Calendario_y_Examenes" src="https://github.com/user-attachments/assets/9d5c8599-7f21-424c-8bb4-0cebf8b824f2" />

---

## 🚀 Instalación y Despliegue

### Requisitos previos
*   **Docker Desktop** instalado y en ejecución.

### Pasos para arrancar

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Zynrir/App-Gestor-Acad-mico.git
   cd App-Gestor-Acad-mico

## **Levantar la aplicación con Docker:**

```bash
docker-compose up --build
```
## Acceso a la plataforma:

Frontend (App): http://localhost:80

Backend (API): http://localhost:3000

🛠️ Tecnologías utilizadas

Frontend: React, Tailwind CSS, Axios.

Backend: Node.js, Express.

Base de Datos: PostgreSQL (inicializada vía init.sql).

Infraestructura: Docker, Docker Compose, Nginx.
