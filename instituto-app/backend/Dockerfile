# Usamos una imagen ligera de Node.js (versión 18 Alpine)
FROM node:18-alpine

# Creamos el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiamos primero los archivos de dependencias para aprovechar la caché de Docker
COPY package*.json ./

# Instalamos las dependencias del proyecto
RUN npm install

# Copiamos el resto del código fuente del backend
COPY . .

# Exponemos el puerto 3000 (el mismo que definimos en server.js)
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["npm", "start"]