# Cache Invalidation Strategy

## What We Cache

| Cache Key | Data | TTL | Invalidation Trigger |
|---|---|---|---|
| `projects:{orgId}` | List of org projects | 5 minutes | Create, update, delete project |

## Current Implementation: In-Memory + Redis-Ready

The cache uses `@nestjs/cache-manager` which is configured with the **memory store** in development and can be switched to **Redis** in production by changing the store configuration.

### Switch to Redis Cache (Production)

```typescript
// Install ioredis adapter
npm install cache-manager-ioredis-yet

// In AppModule:
CacheModule.registerAsync({
  isGlobal: true,
  useFactory: async (configService: ConfigService) => {
    const { redisInsStore } = await import('cache-manager-ioredis-yet');
    return {
      store: await redisInsStore({
        host: configService.get('redis.host'),
        port: configService.get('redis.port'),
        ttl: 300, // seconds
      }),
    };
  },
})
```

## Cache Invalidation Strategy: Write-Through + Explicit Delete

```
Write Path:
  API Request → Service → Database Write → Cache.del(key) → Return response

Read Path:
  API Request → Service → Cache.get(key)
                              ├── HIT  → Return cached data
                              └── MISS → Database Read → Cache.set(key, data, TTL)
```

### Why Explicit Delete vs. Time Expiry Only?

**Consistency**: After a write, the next read will always fetch fresh data from DB (cache miss). Without explicit invalidation, stale data could be served for up to TTL (5 minutes).

**Trade-off**: Every write incurs a cache delete operation. This is a `O(1)` Redis `DEL` — negligible cost.

## Future Enhancements

### Rate Limiting (Redis-backed)

Currently using in-memory throttler. For multi-instance deployments, use Redis store:

```typescript
npm install @nestjs/throttler @nestjs/throttler-storage-redis

ThrottlerModule.forRootAsync({
  useFactory: (configService: ConfigService, redis: Redis) => ({
    throttlers: [{ ttl: 60000, limit: 100 }],
    storage: new ThrottlerStorageRedisService(redis),
  }),
})
```

### Session Caching

User profile data (fetched on every authenticated request) can be cached:

```typescript
// Cache user profile for 10 minutes
await this.cacheManager.set(`user:${userId}`, userProfile, 600000);
```

Invalidate on profile update.
