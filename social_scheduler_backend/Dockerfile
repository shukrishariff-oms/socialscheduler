# Gunakan imej Python yang ringan
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install dependencies sistem (jika perlu untuk library tertentu)
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

# Copy requirements dan install
# Copy semua fail dahulu (untuk debug context issues)
COPY . .
RUN ls -la
RUN pip install --no-cache-dir -r requirements.txt

# Copy semua kod backend
COPY . .

# Expose port (FastAPI default)
EXPOSE 8000

# Jalankan server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
