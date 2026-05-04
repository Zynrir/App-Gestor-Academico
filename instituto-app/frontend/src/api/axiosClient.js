import axios from 'axios';

// Configuración base para conectarse al backend
// Si estamos en Docker, usará la URL del contenedor, si no, localhost
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const axiosClient = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default axiosClient;