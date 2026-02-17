# SocialCmd - Pusat Perintah Media Sosial 🚀

Sistem pengurusan media sosial "Command Center" yang lengkap dengan penjadualan AI, analitik, dan integrasi pelbagai platform (LinkedIn, X, Threads).

## 📋 Keperluan Sistem

- **Docker** & **Docker Compose**
- **Git**

## 🚀 Cara Pemasangan & Pelancaran (Server)

Ikuti langkah-langkah ini untuk melancarkan sistem di server anda (VPS/Ubuntu/Debian).

### 1. Clone Projek
```bash
git clone https://github.com/username-anda/social-media-scheduler.git
cd social-media-scheduler
```

### 2. Tetapan Environment
Cipta fail `.env` dalam folder `social_scheduler_backend`:
```bash
cd social_scheduler_backend
cp .env.example .env  # Jika ada, atau cipta baru
nano .env
```
Isikan token API anda:
```ini
LINKEDIN_ACCESS_TOKEN=token_anda
LINKEDIN_PERSON_URN=urn_anda
THREADS_USER_ID=id_anda
THREADS_ACCESS_TOKEN=token_anda
```

### 3. Lancarkan dengan Docker
Kembali ke folder utama dan jalankan:
```bash
docker-compose up -d --build
```
Sistem akan mula membina container untuk Backend dan Frontend.
- **Frontend**: http://ip-server-anda:80
- **Backend API**: http://ip-server-anda:8000
- **Docs (Swagger)**: http://ip-server-anda:8000/docs

## 🔄 Cara Update (Deploy Script)
Apabila ada perubahan kod di GitHub, login ke server dan jalankan skrip ini:

```bash
chmod +x deploy.sh
./deploy.sh
```
Skrip ini akan menarik kod terkini dan restart Docker secara automatik.

## 🛠 Struktur Projek
- `/social_scheduler_backend`: FastAPI (Python)
- `/social_scheduler_frontend`: React + Vite (Node.js)

---
Dibina dengan ❤️ oleh Antigravity.
