# SaaS Workspace — Project Management Platform

A production-grade **Multi-Tenant SaaS** Project Management system built as a full-stack assessment deliverable.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS, TypeScript, TypeORM |
| Frontend | React 19, Vite, MUI v7, Zustand |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Queues | BullMQ |
| Real-time | Socket.IO (WebSockets) |
| Auth | JWT (access + refresh tokens) |
| Container | Docker, docker-compose |
| CI/CD | GitHub Actions |
| Reverse Proxy | Nginx |

---

## 📁 Project Structure

```
saas-workspace/
├── backend/          # NestJS API
├── frontend/         # React + Vite SPA
├── nginx/            # Reverse proxy config
├── .github/workflows # CI/CD pipelines
├── docs/             # Architecture & design docs
└── docker-compose.yml
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v22+
- **Docker** & **Docker Compose** (recommended)
- **PostgreSQL** 16 (if running locally without Docker)
- **Redis** 7 (if running locally without Docker)

---

### Option A — Docker (Recommended)

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd saas-workspace

# 2. Copy and edit the root .env
cp .env.example .env
# Edit .env — set a strong JWT_SECRET

# 3. Start all services
docker-compose up --build

# 4. Open the app
open http://localhost
# Swagger API docs: http://localhost/api/docs
```

---

### Option B — Local Development

#### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your local Postgres + Redis settings

npm install
npm run start:dev
# API: http://localhost:3000
# Swagger: http://localhost:3000/api/docs
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
# App: http://localhost:5173
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|---|---|---|
| `NODE_ENV` | `development` / `production` / `test` | No |
| `PORT` | API port (default: 3000) | No |
| `FRONTEND_URL` | CORS allowed origin | No |
| `DB_HOST` | PostgreSQL host | Yes |
| `DB_PORT` | PostgreSQL port | No |
| `DB_USERNAME` | PostgreSQL user | Yes |
| `DB_PASSWORD` | PostgreSQL password | Yes |
| `DB_NAME` | Database name | Yes |
| `REDIS_HOST` | Redis host | Yes |
| `REDIS_PORT` | Redis port | No |
| `JWT_SECRET` | **Strong random secret** | ✅ Required |
| `JWT_ACCESS_EXPIRATION` | Access token TTL (e.g. `15m`) | No |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL (e.g. `7d`) | No |

> **Production**: Generate `JWT_SECRET` with: `openssl rand -hex 64`

---

## 🔐 RBAC Permissions Matrix

| Endpoint | ADMIN | EDITOR | VIEWER |
|---|:---:|:---:|:---:|
| Create org | ✅ | — | — |
| Add/remove member | ✅ | — | — |
| Create project | ✅ | ✅ | — |
| Update project | ✅ | ✅ | — |
| Delete project | ✅ | — | — |
| Create task | ✅ | ✅ | — |
| Update task | ✅ | ✅ | — |
| Delete task | ✅ | — | — |
| View everything | ✅ | ✅ | ✅ |
| Payments | ✅ | — | — |

---

## 🧪 Running Tests

```bash
# Backend unit tests
cd backend && npm run test

# Backend test coverage
cd backend && npm run test:cov

# Backend e2e tests (requires DB + Redis)
cd backend && npm run test:e2e

# Frontend tests
cd frontend && npm run test
```

---

## 🐳 Docker Services

| Service | Port | Description |
|---|---|---|
| nginx | 80 | Reverse proxy (entry point) |
| backend | 3000 (internal) | NestJS API |
| frontend | 80 (internal) | React SPA via Nginx |
| postgres | 5432 | PostgreSQL database |
| redis | 6379 | Redis cache & queue |

---

## 📚 API Documentation

Swagger UI is available at `/api/docs` when the backend is running.

All protected endpoints require:
- `Authorization: Bearer <access_token>` header
- `X-Org-Id: <org-uuid>` header for tenant-scoped operations

---

## 📖 Architecture Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [Row-Level Security (RLS)](docs/RLS_EXPLANATION.md)
- [Security Design](docs/SECURITY.md)
- [Cache Strategy](docs/CACHE_STRATEGY.md)
- [Observability](docs/OBSERVABILITY.md)
