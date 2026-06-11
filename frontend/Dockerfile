# Etapa 1: Build
FROM node:22-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
# npm ci instala las versiones EXACTAS del package-lock.json (reproducible).
RUN npm ci
COPY . .

# Opcional: URL absoluta de la API. Si no se define, el frontend usa la
# ruta relativa /api (proxy de nginx), que funciona desde cualquier IP
# o dominio sin recompilar.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Etapa 2: Producción
FROM nginx:alpine AS production-stage
COPY default.conf /etc/nginx/conf.d/default.conf
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
