# Stage 1: Build React App
FROM node:18-alpine as build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source dan build
COPY . .
RUN npm run build

# Stage 2: Serve dengan Nginx
FROM nginx:alpine

# Copy hasil build ke folder Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config (untuk handle React Router & Proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
