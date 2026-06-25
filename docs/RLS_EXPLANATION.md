# PostgreSQL Row-Level Security (RLS)

## What is RLS?

PostgreSQL Row-Level Security allows defining **per-row access policies** that are enforced at the database engine level — even if the application has a bug, the database rejects unauthorized queries.

## How It Strengthens Multi-Tenant Isolation

### Current Approach

Our application enforces tenant isolation at the **application layer** via:
- `TenantGuard` — checks user membership in org before processing request
- All queries scoped by `orgId` in WHERE clauses

### Adding RLS (Production Enhancement)

To add database-level enforcement as a defence-in-depth measure:

#### Step 1: Enable RLS on tenant-scoped tables

```sql
-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create a DB role for the API
CREATE ROLE api_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO api_user;
```

#### Step 2: Create Policies

```sql
-- Projects: only accessible to org members
CREATE POLICY project_isolation ON projects
  USING (
    org_id IN (
      SELECT org_id FROM memberships
      WHERE user_id = current_setting('app.current_user_id')::uuid
    )
  );

-- Tasks: accessible only if project's org is accessible
CREATE POLICY task_isolation ON tasks
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN memberships m ON m.org_id = p.org_id
      WHERE m.user_id = current_setting('app.current_user_id')::uuid
    )
  );
```

#### Step 3: Set the session variable per request

In the NestJS TypeORM connection, run before each query:

```sql
SET app.current_user_id = '<user-uuid>';
```

This can be done via a TypeORM subscriber or middleware.

## Benefits

| Protection Layer | Covers |
|---|---|
| TenantGuard (app) | Normal operation |
| RLS (database) | App bugs, raw DB access, compromised queries |

## Trade-offs

| Pro | Con |
|---|---|
| Defence in depth | Adds query overhead (~5-15%) |
| Protects against application bugs | Requires careful session management |
| Audit-friendly | More complex migrations |

## Conclusion

RLS is the **gold standard** for multi-tenant isolation. In production, it should be enabled on all tenant-scoped tables as a complementary layer to application-level checks.
