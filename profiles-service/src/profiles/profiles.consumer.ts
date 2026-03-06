import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { ProfilesService } from './profiles.service';
import type { EmployeeCreatedPayload, EmployeeDeletedPayload } from './profiles.service';

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
        @Payload() data: EmployeeDeletedPayload,
        @Ctx() context: RmqContext,
    ): Promise<void> {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        try {
            this.logger.log(`[EVENT RECEIVED] employee.deleted | id: ${data.id}`);
            await this.profilesService.handleEmployeeDeleted(data.id);
            channel.ack(originalMsg);
        } catch (error) {
            this.logger.error(`Error handling employee.deleted: ${(error as Error).message}`);
            channel.nack(originalMsg, false, false);
        }
    }
}
