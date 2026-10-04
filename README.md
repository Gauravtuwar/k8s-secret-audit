# Kubernetes Secret Management and Encryption at Rest Audit Tool

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/)
[![Next.js 15+](https://img.shields.io/badge/next.js-15+-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)

An enterprise-grade, production-quality web application designed for cybersecurity engineers, DevSecOps teams, and cloud security architects to audit Kubernetes Secret management practices, RBAC exposures, and control-plane **etcd Encryption at Rest** configurations.

---

## 1. Project Overview

Kubernetes Secrets store sensitive configuration data such as database passwords, API tokens, and TLS certificates. However, by default, Kubernetes stores Secrets as unencrypted Base64-encoded strings in `etcd`. Furthermore, over-privileged RBAC roles and environment variable injections frequently expose credentials to container workloads.

This tool provides an end-to-end audit dashboard and security engine to continuously verify:
1. Control-plane **etcd Encryption at Rest** configuration (`EncryptionConfiguration`, provider ordering, KMS v1/v2, identity fallback).
2. Fine-grained **RBAC Secret permissions** (Roles, ClusterRoles, ServiceAccount bindings).
3. **Secret Hygiene & Workload Exposure** (stale secrets, shared secret blast radius, env vs tmpfs volume mounts).

---

## 2. Problem Statement

Many organizations assume that Kubernetes Secrets are encrypted by default. In reality:
- `etcd` datastore snapshots contain raw unencrypted plaintext unless `EncryptionConfiguration` is explicitly configured.
- If the `identity` provider is placed first in `EncryptionConfiguration`, newly created secrets remain written in plaintext.
- Microservices frequently inject secrets via environment variables (`envFrom`), exposing credentials in process listings and crash dumps.

---

## 3. Objectives

- **Zero-Trust Data Protection**: Never access, request, or store raw `.data` or `.stringData` secret bytes.
- **Rule-Based Detection**: Evaluate KSA-001 through KSA-010 rule violations deterministically.
- **Security Posture Scoring**: Provide a transparent Application Security Score (0-100) tracking posture over time.
- **Executive Reporting**: Compile comprehensive PDF reports and JSON exports for compliance audits.

---

## 4. Architecture

```
                    ┌─────────────────────────┐
                    │      Vercel / Edge      │
                    │   Next.js 15+ Frontend  │
                    └────────────┬────────────┘
                                 │
                                 │ HTTPS REST API (JWT)
                                 ▼
                    ┌─────────────────────────┐
                    │ Render / Railway / Fly  │
                    │   FastAPI Python 3.12   │
                    └────────┬────────┬───────┘
                             │        │
                  ┌──────────┘        └──────────┐
                  ▼                              ▼
         ┌────────────────┐              ┌──────────────┐
         │ PostgreSQL DB  │              │  Kubernetes  │
         │ Audit History  │              │ API Server   │
         └────────────────┘              └──────────────┘
```

---

## 5. Technology Stack

### Frontend
- **Framework**: Next.js 15+ (App Router) & React 19
- **TypeScript**: Strict type checking
- **Styling**: Tailwind CSS & custom dark/light theme SOC platform UI
- **Icons & Charts**: Lucide React & Recharts
- **Components**: Primitive components based on shadcn/ui

### Backend
- **Framework**: Python 3.12+ & FastAPI
- **Database ORM**: SQLAlchemy 2.0+ & Alembic migrations
- **Validation**: Pydantic v2 & email-validator
- **Security**: Passlib (PBKDF2/Argon2/Bcrypt) & python-jose JWT
- **Kubernetes Client**: Official `kubernetes` Python SDK
- **PDF Engine**: ReportLab

### Database & Infrastructure
- **PostgreSQL**: Managed PostgreSQL (Neon / Supabase / Managed PG)
- **Containerization**: Docker & `docker-compose`

---

## 6. Security Rules (KSA-001 - KSA-010)

- **KSA-001**: Encryption at Rest Not Verified / Enabled
- **KSA-002**: Broad RBAC Permissions to Secret Resources
- **KSA-003**: Cluster-Wide Secret Access via ClusterRoleBindings
- **KSA-004**: Sensitive Secret Referenced by Multiple Workloads
- **KSA-005**: Potentially Stale Secret Exceeding Rotation Lifecycle (> 90 days)
- **KSA-006**: Secret Exposed via Workload Environment Variables (`envFrom`)
- **KSA-007**: Excessive ServiceAccount Permissions Involving Secrets
- **KSA-008**: Weak or Static Encryption Provider Configuration
- **KSA-009**: Identity Provider Fallback Enabled Before Cipher Providers
- **KSA-010**: Secret Management Configuration Requires Review

---

## 7. Main Pages

- `/login` — Secure email/password authentication
- `/register` — Analyst registration
- `/forgot-password` — Password recovery workflow
- `/dashboard` — Security SOC dashboard with 5 Recharts charts & real metrics
- `/clusters` — Cluster connection management & connectivity testing
- `/clusters/connect` — Connect via Kubeconfig, Token, or Demo Mode
- `/audits` — Audit execution history timeline
- `/audits/[id]` — Deep-dive audit run inspector
- `/findings` — KSA rule violation registry with search, filter & status updater
- `/secrets` — Secrets Inventory (Metadata ONLY! Payload values strictly redacted)
- `/encryption` — Dedicated Encryption at Rest module
- `/reports` — PDF compliance report generator & JSON export
- `/settings` — Audit thresholds & zero-trust policy configuration
- `/profile` — User identity & active session JWT viewer

---

## 8. Installation & Setup

### Prerequisites
- Node.js 20+
- Python 3.12+
- Docker (Optional)

### Clone & Environment Setup
```bash
git clone https://github.com/your-org/k8s-secret-audit.git
cd k8s-secret-audit
cp .env.example .env
```

### Option A: Local Run with Docker Compose
```bash
docker compose up --build
```
Access Points:
- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/api/v1/docs`

### Option B: Local Run (Manual)

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m pytest # Run backend test suite
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run type-check # Run TypeScript verification
npm run build      # Verify production build
npm run dev        # Start development server
```

---

## 9. Running an Audit & Demo Mode

1. Navigate to `/dashboard` or `/clusters/connect`.
2. Select **Demo Mode** to inspect synthetic cluster data without cloud credentials.
3. Click **"Run New Audit"** to execute the multi-step audit pipeline.
4. Open `/audits/[id]` to inspect findings, RBAC mappings, and etcd encryption checks.
5. Click **"Generate Report"** to compile an executive PDF or machine-readable JSON payload.

---

## 10. Security Model & Redaction Guarantee

- **Zero Secret Exposure**: The application NEVER requests, prints, or stores secret payload bytes.
- **Safe Credential Storage**: Credentials are encrypted or referenced safely.
- **Read-Only Assessor**: Performs zero write/delete operations on target K8s clusters.

---

## 11. Verification & Test Execution

Run backend pytest suite:
```bash
.\venv\Scripts\python.exe -m pytest
```
Run frontend type-checking & Next.js production build:
```bash
cd frontend
npm run type-check
npm run build
```

---

## 12. License

This project is open source software licensed under the [MIT License](LICENSE).
