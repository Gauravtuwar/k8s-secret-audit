# Kubernetes Secret Management & Encryption at Rest Audit Tool — Architecture Specification

## System Overview

The **Kubernetes Secret Management & Encryption at Rest Audit Tool** is an enterprise-grade cybersecurity audit platform designed to evaluate Kubernetes cluster security postures without ever accessing or exposing raw Secret payload bytes.

```
                    ┌─────────────────────────┐
                    │      Vercel / Edge      │
                    │    Next.js 15 Frontend  │
                    └────────────┬────────────┘
                                 │
                                 │ HTTPS REST API (JWT / Bearer)
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

## Component Breakdown

### 1. Frontend Architecture (Next.js 15+ App Router)
- **Framework**: Next.js 15+ with React 19 and App Router architecture.
- **Styling**: Tailwind CSS with dark/light mode toggle and SOC cybersecurity dashboard styling.
- **Component Library**: Custom accessible UI primitives based on shadcn/ui and Lucide React icons.
- **Visualization**: Recharts for rendering 5 real-time security dashboard charts:
  1. Findings by Severity Breakdown (Bar Chart)
  2. Security Score Over Time (Area Trend Chart)
  3. Control Plane Encryption Status (Donut Chart)
  4. Findings Distribution by Namespace (Horizontal Bar Chart)
  5. Audit History Timeline
- **State & Authentication**: React Auth Context with JWT token management, automatic local persistence, and safe Demo Mode switching.

### 2. Backend Architecture (FastAPI & Python 3.12)
- **API Engine**: FastAPI asynchronous REST API endpoints with automated OpenAPI validation schemas.
- **ORM & DB Layer**: SQLAlchemy 2.0+ with PostgreSQL compatibility (Neon/Supabase/Managed PG) and local SQLite fallback for fast testing.
- **Security Engine**: Passlib (PBKDF2/Argon2/Bcrypt) password hashing and python-jose JWT token creation/verification.
- **Report Generation**: ReportLab engine generating executive PDF reports and machine-readable JSON exports.

### 3. Audit Engine & Kubernetes Metadata Client
- **Client**: `KubernetesMetadataClient` using official `kubernetes` Python SDK.
- **Zero-Trust Rule**: Reads exclusively metadata (`name`, `namespace`, `type`, `created_at`, `age_days`, `labels`, `annotations`, key counts, and workload volume/env mounts).
- **Redaction**: Never requests or logs `Secret.data` or `Secret.stringData` contents.

### 4. Database Schema
- `users`: User profiles and hashed credentials.
- `clusters`: Kubernetes cluster metadata and connection status.
- `cluster_connections`: Safe connection references and credentials metadata.
- `audits`: Historical audit runs, security scores, and aggregate counts.
- `findings`: KSA-001 through KSA-010 security rule violation records.
- `secrets_inventory`: Secret metadata and workload mounting references.
- `rbac_permissions`: Roles, ClusterRoles, and ServiceAccount permission mappings.
- `encryption_checks`: etcd EncryptionConfiguration provider evaluations.
- `reports`: PDF and JSON compiled report artifacts.
- `audit_logs`: Audit trail logs for compliance.
