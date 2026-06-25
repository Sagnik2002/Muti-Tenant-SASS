# Architecture Overview

## System Architecture

```
                          ┌─────────────────┐
                          │   Browser/Client  │
                          └────────┬──────────┘
                                   │ HTTP / WebSocket
                          ┌────────▼──────────┐
                          │   Nginx (Port 80)  │  ← Reverse Proxy
                          └──┬─────────────┬──┘
                    /api/*   │             │  /socket.io/*  /
                    ┌────────▼─┐       ┌───▼──────────────┐
                    │  NestJS  │       │  React SPA (Nginx)│
                    │  API :3000│      │  :80 (internal)   │
                    └──┬───┬───┘       └───────────────────┘
                 DB    │   │  Redis
          ┌────────────▼┐ ┌▼──────────┐
          │ PostgreSQL  │ │   Redis   │
          │    :5432    │ │   :6379   │
          └─────────────┘ └─────┬─────┘
                                │
                          BullMQ Queues
```

## Key Architectural Decisions

### 1. Multi-Tenancy: Shared Database, Row-Level Scoping

**Choice**: Single database with `org_id` foreign key on all tenant-scoped entities.

**Why**: Simplest operational model. Works well at scale when combined with PostgreSQL RLS (see [RLS doc](RLS_EXPLANATION.md)). Avoids schema-migration complexity of schema-per-tenant.

**Alternatives**:
- *Schema-per-tenant*: Better isolation, harder migrations
- *DB-per-tenant*: Maximum isolation, expensive at scale

**Trade-off**: Accidental data leakage is prevented at app layer (TenantGuard) + DB layer (RLS). Slightly less isolation than separate DBs.

### 2. Authentication: JWT with Refresh Token Rotation

**Choice**: Short-lived access tokens (15m) + long-lived refresh tokens (7d) stored as hashed values in PostgreSQL.

**Why**: Stateless access tokens scale horizontally. Hashed refresh tokens allow revocation (logout, breach response). Rotation on each refresh prevents token replay.

**SSO readiness**: The auth layer uses a Passport strategy abstraction. Adding SAML/OIDC means implementing a new Passport strategy — zero changes to business logic.

### 3. Real-time: Socket.IO via BullMQ

**Choice**: Events are first queued in BullMQ (Redis), then delivered via WebSocket to org rooms.

**Why**: Decoupling queue from delivery means notifications survive if the WS server restarts. BullMQ provides retries, dead-letter queues, and job monitoring.

**Trade-off**: ~10-50ms added latency vs. direct WS emit. Acceptable for project management use cases.

### 4. Payment Abstraction: Strategy Pattern

**Choice**: `PaymentProvider` interface injected via NestJS DI token `PAYMENT_PROVIDER`.

**Why**: Swapping providers = swap the `useClass` in `PaymentsModule`. Zero business logic changes. Satisfies the Open/Closed Principle.

### 5. State Management: Zustand

**Choice**: Zustand over Redux Toolkit.

**Why**: 70% less boilerplate for the same functionality. No reducers, no action creators. Direct mutations with immer optional. Scales to the complexity needed here.

### 6. Draft Persistence: IndexedDB

**Choice**: `idb-keyval` library for IndexedDB access.

**Why**: Survives page refresh, browser restarts, and offline scenarios. Zero server cost. Form data is keyed by form type (`project-form-draft`, `task-form-draft`).

## Module Dependency Graph

```
AppModule
├── ConfigModule (global)
├── TypeOrmModule (global)
├── CacheModule (global, Redis)
├── BullModule (global, Redis)
├── ThrottlerModule
├── AuthModule
│   └── UsersModule (entity only)
├── UsersModule
├── OrganizationsModule
├── ProjectsModule
│   └── NotificationsModule (circular ref via forwardRef)
├── TasksModule
│   └── NotificationsModule (circular ref via forwardRef)
├── PaymentsModule
├── NotificationsModule
│   ├── BullMQ notifications queue
│   └── WebSocket Gateway
└── HealthModule
```
