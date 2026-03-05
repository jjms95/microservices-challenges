import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { ProfilesService } from './profiles.service';
import type { EmployeeCreatedPayload } from './profiles.service';

@Controller()
export class ProfilesConsumer {
    private readonly logger = new Logger(ProfilesConsumer.name);

    constructor(private readonly profilesService: ProfilesService) { }

    @EventPattern('employee.created')
    async handleEmployeeCreated(
        @Payload() data: EmployeeCreatedPayload,
        @Ctx() context: RmqContext,
    ): Promise<void> {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();

        try {
            this.logger.log(`[EVENT RECEIVED] employee.created | id: ${data.id}`);
            await this.profilesService.handleEmployeeCreated(data);
            channel.ack(originalMsg);
        } catch (error) {
            this.logger.error(`Error handling employee.created: ${(error as Error).message}`);
            channel.nack(originalMsg, false, false);
        }
    }

    @EventPattern('employee.deleted')
    async handleEmployeeDeleted(
        @Payload() _data: unknown,
        @Ctx() context: RmqContext,
    ): Promise<void> {
        // profiles-service does not act on employee deletion
        // Acknowledge to prevent message from being requeued
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        channel.ack(originalMsg);
    }
}
