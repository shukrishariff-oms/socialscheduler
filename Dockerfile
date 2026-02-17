# --- Stage 1: Build Frontend ---
FROM node:18-alpine as frontend-builder
WORKDIR /app/frontend

# Copy dependencies first for caching
COPY social_scheduler_frontend/package*.json ./
RUN npm install

# Copy source and build
COPY social_scheduler_frontend/ .
# Frontend needs to know API URL is relative
ENV VITE_API_URL=/
RUN npm run build

# --- Stage 2: Serve with Backend ---
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install dependencies sistem
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

# Copy requirements dan install (from backend folder)
COPY social_scheduler_backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy semua kod backend
COPY social_scheduler_backend/ .

# Copy built frontend dari Stage 1 ke folder static
COPY --from=frontend-builder /app/frontend/dist /app/static

# Expose port
EXPOSE 8000

# Jalankan server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
