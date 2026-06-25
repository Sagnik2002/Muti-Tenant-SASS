import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Membership } from "../organizations/entities/membership.entity";
import { NotificationsGateway } from "./notifications.gateway";
import { NotificationsService } from "./notifications.service";
import { NotificationsProcessor } from "./notifications.processor";

@Module({
  imports: [
    TypeOrmModule.forFeature([Membership]),
    BullModule.registerQueue({
      name: "notifications",
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("jwt.secret"),
      }),
    }),
  ],
  providers: [
    NotificationsGateway,
    NotificationsService,
    NotificationsProcessor,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
