# Kubernetes Secret Management & Encryption at Rest Audit Tool — Deployment Guide

## Deployment Overview

This application is designed for cloud-native zero-downtime deployment:
- **Frontend**: Next.js 15 App Router deployed on **Vercel**.
- **Backend**: FastAPI Python 3.12 deployed on **Render / Railway / Fly.io**.
- **Database**: PostgreSQL database hosted on **Neon / Supabase / Managed PostgreSQL**.

---

## 1. Deploying Frontend to Vercel

1. Push your repository to GitHub.
2. In Vercel Console, select **Add New Project** and import the repository.
3. Set **Root Directory** to `frontend`.
4. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-api.onrender.com/api/v1`
5. Click **Deploy**. Vercel will automatically build the Next.js production bundle.

---

## 2. Deploying Backend to Render / Railway / Fly.io

### Render / Railway Setup
1. Create a new Web Service and link the `backend` directory.
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variables:
   ```env
   DATABASE_URL=postgresql://audit_user:password@ep-neon-db.neon.tech/k8s_audit_db
   SECRET_KEY=your-32byte-min-random-secret-key
   CORS_ORIGINS=["https://your-frontend-app.vercel.app"]
   ```

---

## 3. Database Migration & Initialization

Tables are automatically created on startup via `Base.metadata.create_all(bind=engine)`.
For Alembic migrations in production pipelines:
```bash
cd backend
alembic upgrade head
```

---

## 4. Local Docker Compose Setup

Run local PostgreSQL database and containers:
```bash
docker compose up --build
```
Access points:
- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/api/v1/docs`
- PostgreSQL: `localhost:5432`
