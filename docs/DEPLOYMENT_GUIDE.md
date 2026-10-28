# 🚀 InsightGen AI — Complete Production Deployment Guide

This guide provides end-to-end instructions for deploying the **InsightGen AI** platform (FastAPI deterministic backend + Next.js interactive frontend) to production.

---

## 🏗️ Architecture Overview

| Component | Technology | Default Port | Production Role |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js 14 (React 18, TypeScript, Tailwind, Recharts) | `3000` | UI, Chart Studio, Ingestion Zone |
| **Backend** | FastAPI, Pandas 2.2, Pydantic v2, Uvicorn | `8000` | Profiling, AI Planning, Deterministic Engine |
| **Storage** | Local disk / Docker volume (`uploads/`) | — | Secure dataset persistence & indexing |
| **AI Layer** | Google Gemini (via `google-genai` SDK) | — | Natural language analysis planning & narration |

---

## ⚡ Option 1: Docker Compose (Recommended — 1 Command)

The simplest and most resilient way to run InsightGen AI on any cloud VM (AWS EC2, DigitalOcean Droplet, GCP Compute Engine, Azure VM, or local server).

### 1. Prerequisites
- [Docker](https://docs.docker.com/get-docker/) (v24+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2+)

### 2. Configure Environment
Create a `.env` file at the root of the repository:
```bash
# Gemini API Key (Optional — built-in offline semantic rules run if omitted)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Security & CORS
ENVIRONMENT=production
DEBUG=False
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
CORS_ORIGINS=["http://localhost:3000","https://yourdomain.com"]

# Dataset Ingestion Limit
MAX_UPLOAD_SIZE_MB=50
```

### 3. Build & Launch Containers
```bash
docker compose up -d --build
```

### 4. Verify Services
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend Health**: [http://localhost:8000/health](http://localhost:8000/health)
- **Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

To view logs:
```bash
docker compose logs -f
```

To stop containers:
```bash
docker compose down
```

---

## ☁️ Option 2: Cloud PaaS (Vercel + Render / Railway)

Ideal for managed serverless hosting with zero server maintenance.

### Part A: Backend on Render or Railway
1. **Repository**: Push this repo to GitHub.
2. **New Web Service**: Connect your GitHub repository.
3. **Root Directory**: `backend`
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. **Environment Variables**:
   - `ENVIRONMENT` = `production`
   - `DEBUG` = `False`
   - `GEMINI_API_KEY` = `your_gemini_api_key`
   - `GEMINI_MODEL` = `gemini-1.5-flash`
   - `CORS_ORIGINS` = `["https://your-frontend-app.vercel.app"]`
7. **Persistent Disk (Optional but recommended)**: Mount a disk to `/app/uploads` (1GB to 10GB).
8. Copy the assigned backend URL (e.g., `https://insightgen-backend.onrender.com`).

### Part B: Frontend on Vercel
1. Go to [Vercel](https://vercel.com) and import the repository.
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Next.js`.
4. Add **Environment Variable**:
   - `NEXT_PUBLIC_API_URL` = `https://insightgen-backend.onrender.com` (your Render backend URL)
5. Click **Deploy**.

---

## 🐧 Option 3: Ubuntu Linux VM (Nginx + Systemd + SSL)

For enterprise self-hosting on Ubuntu 22.04 / 24.04 LTS.

### 1. System Setup
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv nodejs npm nginx certbot python3-certbot-nginx
```

### 2. Backend Service Setup
```bash
cd /var/www/InsightGen-AI/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create systemd service
sudo nano /etc/systemd/system/insightgen-backend.service
```

Add the following content:
```ini
[Unit]
Description=InsightGen AI FastAPI Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/var/www/InsightGen-AI/backend
EnvironmentFile=/var/www/InsightGen-AI/backend/.env
ExecStart=/var/www/InsightGen-AI/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 3
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable & start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now insightgen-backend
```

### 3. Frontend Setup
```bash
cd /var/www/InsightGen-AI/frontend
npm ci
npm run build

# Create systemd service for Next.js
sudo nano /etc/systemd/system/insightgen-frontend.service
```

Add the following content:
```ini
[Unit]
Description=InsightGen AI Next.js Frontend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/var/www/InsightGen-AI/frontend
Environment="NODE_ENV=production"
Environment="PORT=3000"
Environment="NEXT_PUBLIC_API_URL=http://127.0.0.1:8000"
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable & start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now insightgen-frontend
```

### 4. Nginx Reverse Proxy & SSL
```bash
sudo nano /etc/nginx/sites-available/insightgen
```

```nginx
server {
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API routing
    location ~ ^/(api|health|docs|openapi.json) {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/insightgen /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 🔒 Production Security Checklist
- [x] **Zero Hallucination Guaranteed**: Math executed exclusively in deterministic Pandas, not generated by LLM.
- [x] **Safe File Ingestion**: Blocked executable magic bytes (`MZ`, `\x7fELF`), path traversal attempts, and empty uploads.
- [x] **CORS Configuration**: Restrict `CORS_ORIGINS` strictly to your production frontend domain.
- [x] **API Key Security**: `GEMINI_API_KEY` stored strictly on server backend; never bundled into client JS.
- [x] **Graceful Fallbacks**: If external API key is omitted or offline, offline semantic rule planner runs automatically.

