import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationsGateway } from './notifications.gateway';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly gateway: NotificationsGateway) {
    super();
  }

  async process(job: Job<{
    orgId: string;
    event: string;
    payload: Record<string, any>;
    timestamp: string;
  }>) {
    const { orgId, event, payload, timestamp } = job.data;

    this.logger.log(`Processing notification job ${job.id}: ${event} for org ${orgId}`);

    // Deliver via WebSocket to org room
    this.gateway.sendToOrgRoom(orgId, event, {
      ...payload,
      timestamp,
    });

    return { delivered: true };
  }
}
