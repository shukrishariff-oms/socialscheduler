#!/bin/bash

echo "🚀 Memulakan Deployment SocialCmd..."

# 1. Tarik kod terkini dari GitHub
echo "📥 Menarik kod terkini (git pull)..."
git pull origin main

# 2. Bina semula dan restart container
echo "🔄 Restarting Docker Containers..."
docker-compose up -d --build

# 3. Bersihkan imej lama (jimat ruang)
echo "🧹 Membersihkan imej lama..."
docker image prune -f

echo "✅ Deployment Selesai! Sistem kini aktif."
