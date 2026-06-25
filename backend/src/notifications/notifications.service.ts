import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue("notifications")
    private readonly notificationQueue: Queue,
  ) {}

  /**
   * Queue a notification to be sent to all users in the org via WebSocket.
   * The actual delivery happens in the NotificationsProcessor.
   */
  async sendToOrg(orgId: string, event: string, payload: Record<string, any>) {
    try {
      await this.notificationQueue.add("send-notification", {
        orgId,
        event,
        payload,
        timestamp: new Date().toISOString(),
      });
      this.logger.debug(`Queued notification: ${event} for org ${orgId}`);
    } catch (_err) {
      // Redis unavailable — log and continue without queuing
      this.logger.warn(
        `Could not queue notification (Redis unavailable): ${event}`,
      );
    }
  }
}
