import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { Membership } from "../organizations/entities/membership.entity";

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
  namespace: "/notifications",
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} rejected — no token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      client.data.email = payload.email;

      this.logger.log(
        `Client connected: ${client.id} (user: ${payload.email})`,
      );
    } catch (_error) {
      this.logger.warn(`Client ${client.id} rejected — invalid token`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Clients join an org room to receive tenant-scoped notifications.
   */
  @SubscribeMessage("join-org")
  async handleJoinOrg(client: Socket, orgId: string) {
    const userId = client.data.userId;
    if (!userId || !orgId) {
      return { event: "error", data: { message: "Invalid request" } };
    }

    const membership = await this.membershipRepo.findOne({
      where: { userId, orgId },
    });

    if (!membership) {
      this.logger.warn(
        `Client ${client.id} denied join to org:${orgId} — not a member`,
      );
      return {
        event: "error",
        data: { message: "Not a member of this organization" },
      };
    }

    client.join(`org:${orgId}`);
    this.logger.debug(`Client ${client.id} joined room org:${orgId}`);
    return { event: "joined", data: { orgId } };
  }

  @SubscribeMessage("leave-org")
  handleLeaveOrg(client: Socket, orgId: string) {
    client.leave(`org:${orgId}`);
    this.logger.debug(`Client ${client.id} left room org:${orgId}`);
    return { event: "left", data: { orgId } };
  }

  /**
   * Called by the BullMQ processor to emit events to org rooms.
   */
  sendToOrgRoom(orgId: string, event: string, payload: any) {
    this.server.to(`org:${orgId}`).emit(event, payload);
    this.logger.debug(`Emitted ${event} to org:${orgId}`);
  }
}
