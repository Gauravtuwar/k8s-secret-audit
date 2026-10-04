# Kubernetes Secret Management & Encryption at Rest Audit Tool — Security Architecture & Guidelines

## Core Security Principles

### 1. Zero-Trust Metadata Inspection & Redaction Guarantee
- The application **NEVER** requests, reads, prints, or stores `Secret.data` or `Secret.stringData` payload bytes from Kubernetes API endpoints.
- Secret payload values are replaced everywhere with explicit `[REDACTED]` notices.
- User UI warning is rendered on all secret inventory views:
  > *"Secret values are intentionally never displayed or stored by this application."*

### 2. Credential Protection & Safe Storage
- Raw `kubeconfig` text files and ServiceAccount Bearer tokens are **NEVER** stored in plain unencrypted database text.
- Database passwords and secrets are loaded via environment variables (`DATABASE_URL`, `SECRET_KEY`).
- `.env.example` contains variable names only. No credentials are committed to version control.

### 3. Password Hashing & Authentication
- User account passwords are hashed using PBKDF2/Argon2 with high work factors via Passlib.
- Session tokens are signed using JWT (HS256) with expiration enforcement.
- Protected API routes enforce JWT Bearer header validation.

### 4. Non-Destructive Operation
- The tool operates strictly as a read-only security assessment engine.
- No write, update, patch, or delete actions are performed against audited target Kubernetes cluster resources.

### 5. Input Validation & Injection Prevention
- Request payloads are validated through strict Pydantic schemas.
- Database queries use SQLAlchemy parameterized ORM queries to prevent SQL injection vulnerabilities.
