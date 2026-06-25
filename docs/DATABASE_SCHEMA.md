# Database Schema

## Entity Relationship Diagram

```
┌──────────────┐       ┌─────────────────┐       ┌───────────────────┐
│    users     │       │  memberships    │       │  organizations    │
├──────────────┤       ├─────────────────┤       ├───────────────────┤
│ id (PK)      │──┐    │ id (PK)         │    ┌──│ id (PK)           │
│ email UNIQUE │  └───▶│ user_id (FK)    │    │  │ name              │
│ password_hash│       │ org_id (FK)     │◀───┘  │ slug UNIQUE       │
│ first_name   │       │ role ENUM       │       │ plan              │
│ last_name    │       │ created_at      │       │ created_at        │
│ avatar_url   │       └─────────────────┘       │ updated_at        │
│ is_active    │             UNIQUE(user,org)     └────────┬──────────┘
│ created_at   │                                          │
│ updated_at   │                              ┌───────────▼──────────┐
└──────┬───────┘                              │      projects         │
       │                                      ├───────────────────────┤
       │                                      │ id (PK)               │
       │                                      │ org_id (FK)           │
       │                                      │ name                  │
       │                           ┌──────────│ description           │
       │                           │          │ status ENUM           │
       │                           │          │ created_by (FK→users) │
       │                           │          │ created_at            │
       │                           │          │ updated_at            │
       │                           │          └───────────────────────┘
       │                           │
       │                    ┌──────▼──────────┐
       │                    │      tasks       │
       │                    ├─────────────────┤
       │                    │ id (PK)          │
       │                    │ project_id (FK)  │
       │                    │ title            │
       │                    │ description      │
       │                    │ status ENUM      │
       │                    │ priority ENUM    │
       └───────────────────▶│ assignee_id (FK) │
                            │ created_by (FK)  │
                            │ due_date         │
                            │ created_at       │
                            │ updated_at       │
                            └─────────────────┘

┌──────────────────┐    ┌───────────────────┐
│  refresh_tokens  │    │     payments       │
├──────────────────┤    ├───────────────────┤
│ id (PK)          │    │ id (PK)            │
│ user_id (FK)     │    │ org_id (FK)        │
│ token_hash       │    │ amount DECIMAL     │
│ expires_at       │    │ currency           │
│ revoked BOOL     │    │ status ENUM        │
│ created_at       │    │ provider           │
└──────────────────┘    │ provider_ref       │
                        │ metadata JSONB     │
                        │ created_at         │
                        │ updated_at         │
                        └───────────────────┘
```

## Enum Values

| Enum | Values |
|---|---|
| `role` | `ADMIN`, `EDITOR`, `VIEWER` |
| `project_status` | `ACTIVE`, `ARCHIVED`, `COMPLETED` |
| `task_status` | `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE` |
| `task_priority` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `payment_status` | `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED` |

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_org_id ON memberships(org_id);
CREATE INDEX idx_projects_org_id ON projects(org_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_payments_org_id ON payments(org_id);
```
