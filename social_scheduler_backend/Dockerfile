# Gunakan imej Python yang ringan
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install dependencies sistem (jika perlu untuk library tertentu)
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

# Copy requirements dari root context
COPY social_scheduler_backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy semua kod backend
COPY social_scheduler_backend/ .

# Expose port (FastAPI default)
EXPOSE 8000

# Jalankan server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
