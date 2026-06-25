# Security Architecture

## Implemented Security Controls

### 1. JWT Authentication
- **Access tokens**: 15-minute expiry, RS256-compatible (currently HS256)
- **Refresh tokens**: 7-day expiry, stored as bcrypt hashes (cost 10) in PostgreSQL
- **Token rotation**: Every refresh invalidates the old refresh token
- **Revocation**: Logout revokes all refresh tokens for the user

### 2. Password Security
- bcrypt with **12 rounds** (work factor)
- Never stored in plaintext; excluded from all API responses via `@Exclude()`

### 3. RBAC Authorization
- Three roles: `ADMIN > EDITOR > VIEWER`
- Enforced at endpoint level via `RolesGuard` + `@Roles()` decorator
- Org membership validated on every request via `TenantGuard`

### 4. Organization Isolation
- Every tenant-scoped query includes `orgId` WHERE clause
- `TenantGuard` validates membership before request reaches service layer
- `X-Org-Id` header required for all tenant operations

### 5. Input Validation
- `class-validator` + `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true`
- All DTOs explicitly whitelist allowed fields — extra fields are stripped
- SQL injection impossible via TypeORM parameterized queries

### 6. Security Headers
- `helmet` middleware adds: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `HSTS`, `CSP`

### 7. Rate Limiting
- `@nestjs/throttler` — 100 requests/minute per IP globally

---

## How to Integrate SAML/OIDC (Enterprise SSO)

The Passport.js strategy pattern used for JWT makes SSO integration straightforward:

```typescript
// 1. Install the strategy
npm install passport-saml  // or passport-openidconnect

// 2. Implement the strategy
@Injectable()
export class SamlStrategy extends PassportStrategy(Strategy, 'saml') {
  constructor(configService: ConfigService) {
    super({
      entryPoint: configService.get('SAML_ENTRY_POINT'),
      issuer: configService.get('SAML_ISSUER'),
      cert: configService.get('SAML_CERT'),
    });
  }
  async validate(profile: any) {
    // Find or create user from SAML profile
    // Return user object
  }
}

// 3. Add to AuthModule providers - zero changes to controllers or services
```

### OIDC Flow
1. User clicks "Sign in with Google/Okta"
2. Redirected to identity provider
3. Callback to `/auth/oidc/callback`
4. User created/found in DB
5. Standard JWT issued — same token flow as password auth

---

## How to Integrate Vault / KMS for Secret Management

### HashiCorp Vault

```typescript
// 1. Install Vault client
npm install node-vault

// 2. Create a VaultConfigService
@Injectable()
export class VaultConfigService implements OnModuleInit {
  private vault = require('node-vault')({ endpoint: process.env.VAULT_ADDR });

  async onModuleInit() {
    await this.vault.approleLogin({
      role_id: process.env.VAULT_ROLE_ID,
      secret_id: process.env.VAULT_SECRET_ID,
    });
  }

  async getSecret(path: string): Promise<string> {
    const { data } = await this.vault.read(path);
    return data.data.value;
  }
}

// 3. Use in ConfigModule to load JWT_SECRET, DB_PASSWORD from Vault
// rather than environment variables
```

### AWS KMS / GCP KMS
- Use for **envelope encryption** of sensitive DB fields (e.g., payment metadata)
- Generate a Data Encryption Key (DEK) per record
- Wrap the DEK with a KMS Customer Master Key
- Store wrapped DEK alongside encrypted data in DB

---

## Security Checklist for Production

- [ ] Rotate `JWT_SECRET` to a 64-byte random hex string
- [ ] Enable PostgreSQL RLS (see [RLS_EXPLANATION.md](RLS_EXPLANATION.md))
- [ ] Set `NODE_ENV=production` (disables TypeORM `synchronize`)
- [ ] Enable HTTPS via Nginx SSL termination (Let's Encrypt / ACM)
- [ ] Configure Redis AUTH password
- [ ] Enable Vault for secret rotation
- [ ] Set up audit logging (Winston → CloudWatch/ELK)
- [ ] Enable WAF on the load balancer
