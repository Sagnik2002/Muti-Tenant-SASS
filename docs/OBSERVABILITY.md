# Observability

## Structured Logging

All HTTP requests are logged as structured JSON by the `LoggingInterceptor`:

```json
{
  "method": "POST",
  "url": "/api/v1/projects",
  "statusCode": 201,
  "duration": "23ms",
  "userId": "user-uuid",
  "orgId": "org-uuid",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

### Production Logging with Winston

```typescript
npm install nest-winston winston winston-transport-http-stream

// In main.ts:
const logger = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
    // Ship to ELK / Datadog / CloudWatch
    new winston.transports.Http({ host: 'logstash', port: 5000 }),
  ],
});
app.useLogger(logger);
```

---

## Distributed Tracing with OpenTelemetry

### Setup

```typescript
// Install packages
npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
npm install @opentelemetry/exporter-trace-otlp-grpc

// Create instrumentation.ts (loaded before app):
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';

const sdk = new NodeSDK({
  serviceName: 'saas-workspace-backend',
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://jaeger:4317',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

This auto-instruments:
- HTTP requests (every API call creates a span)
- PostgreSQL queries (via `pg` instrumentation)
- Redis operations (via `ioredis` instrumentation)
- BullMQ jobs

### What You Get

```
[Trace: POST /api/v1/projects]
  ├── [TenantGuard.canActivate] 2ms
  ├── [ProjectsService.create] 18ms
  │   ├── [PostgreSQL INSERT] 12ms
  │   ├── [Redis DEL projects:org-uuid] 1ms
  │   └── [BullMQ enqueue notification] 2ms
  └── [HTTP 201] 21ms total
```

---

## Metrics Collection

### Prometheus + Grafana

```typescript
npm install @willsoto/nestjs-prometheus prom-client

// Expose metrics endpoint
@Module({
  imports: [
    PrometheusModule.register({ path: '/metrics', defaultMetrics: { enabled: true } }),
  ],
})

// Custom metrics examples:
const requestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration',
  labelNames: ['method', 'route', 'status_code'],
});

const activeOrgs = new Gauge({
  name: 'active_organizations_total',
  help: 'Total active organizations',
});
```

### Key Metrics to Track

| Metric | Type | Alert Threshold |
|---|---|---|
| `http_request_duration_ms` | Histogram | p99 > 500ms |
| `http_requests_total` | Counter | — |
| `db_query_duration_ms` | Histogram | p99 > 200ms |
| `bullmq_job_wait_ms` | Histogram | > 5s |
| `active_websocket_connections` | Gauge | — |
| `cache_hit_rate` | Gauge | < 50% (investigate) |
