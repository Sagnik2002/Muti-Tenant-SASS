import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CacheModule } from "@nestjs/cache-manager";
import { BullModule } from "@nestjs/bullmq";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";

import configuration from "./config/configuration";
import { validationSchema } from "./config/validation";

import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { OrganizationsModule } from "./organizations/organizations.module";
import { ProjectsModule } from "./projects/projects.module";
import { TasksModule } from "./tasks/tasks.module";
import { PaymentsModule } from "./payments/payments.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { HealthModule } from "./health/health.module";

import { ClassSerializerInterceptor } from "@nestjs/common";
import { GlobalExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";

// Entities
import { User } from "./users/entities/user.entity";
import { Organization } from "./organizations/entities/organization.entity";
import { Membership } from "./organizations/entities/membership.entity";
import { Project } from "./projects/entities/project.entity";
import { Task } from "./tasks/entities/task.entity";
import { RefreshToken } from "./auth/entities/refresh-token.entity";
import { Payment } from "./payments/entities/payment.entity";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const useSSL =
          configService.get<string>("database.ssl") === "true" ||
          configService.get<string>("database.host")?.includes("neon.tech") ||
          configService.get<string>("database.host")?.includes("supabase");
        return {
          type: "postgres" as const,
          host: configService.get<string>("database.host"),
          port: configService.get<number>("database.port"),
          username: configService.get<string>("database.username"),
          password: configService.get<string>("database.password"),
          database: configService.get<string>("database.name"),
          ssl: useSSL ? { rejectUnauthorized: false } : false,
          entities: [
            User,
            Organization,
            Membership,
            Project,
            Task,
            RefreshToken,
            Payment,
          ],
          synchronize: configService.get<string>("NODE_ENV") !== "production",
          logging: configService.get<string>("NODE_ENV") === "development",
        };
      },
    }),

    // Redis Cache (uses Redis when REDIS_CACHE=true, falls back to in-memory)
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const useRedisCache =
          configService.get<string>("redis.host") !== "localhost" &&
          process.env.REDIS_CACHE === "true";
        if (useRedisCache) {
          const { redisStore } = await import("cache-manager-ioredis-yet");
          return {
            store: redisStore,
            host: configService.get<string>("redis.host"),
            port: configService.get<number>("redis.port"),
            ttl: 300,
          };
        }
        // In-memory cache for development / when Redis is unavailable
        return { ttl: 300000 };
      },
    }),

    // BullMQ Queues — lazyConnect allows app to start even if Redis is temporarily unavailable
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>("bull.redis.host"),
          port: configService.get<number>("bull.redis.port"),
          lazyConnect: true,
          enableOfflineQueue: false,
          maxRetriesPerRequest: null,
          // Stop retrying after 3 attempts so the log stays clean in dev
          retryStrategy: (times: number) =>
            times > 3 ? null : Math.min(times * 500, 2000),
        },
      }),
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Feature Modules
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ProjectsModule,
    TasksModule,
    PaymentsModule,
    NotificationsModule,
    HealthModule,
  ],
  providers: [
    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Structured Logging
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Response Transform
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // Serialize responses (excludes @Exclude() fields like passwordHash)
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    // Global Rate Limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
