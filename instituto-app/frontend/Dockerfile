# --- ETAPA 1: Construcción (Build) ---
FROM node:18-alpine as build-stage

WORKDIR /app

# Copiamos dependencias e instalamos
COPY package*.json ./
RUN npm install

# Copiamos el código y construimos la versión de producción
COPY . .
RUN npm run build

# --- ETAPA 2: Servidor (Production) ---
FROM nginx:stable-alpine

# Copiamos los archivos generados en la etapa anterior a la carpeta de Nginx
COPY --from=build-stage /app/build /usr/share/nginx/html

# Copiamos nuestra configuración personalizada de Nginx
# (IMPORTANTE: Asegúrate de tener el archivo nginx.conf en la carpeta frontend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponemos el puerto 80 (puerto web estándar)
EXPOSE 80

# Arrancamos Nginx
CMD ["nginx", "-g", "daemon off;"]