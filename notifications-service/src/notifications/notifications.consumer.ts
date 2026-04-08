import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';
import type { EmployeeCreatedPayload, EmployeeDeletedPayload } from './notifications.service';

@Controller()
export class NotificationsConsumer {
    private readonly logger = new Logger(NotificationsConsumer.name);

    constructor(private readonly notificationsService: NotificationsService) { }

    @EventPattern('employee.created')
    async handleEmployeeCreated(
        @Payload() data: EmployeeCreatedPayload,
        @Ctx() context: RmqContext,
    ): Promise<void> {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();

        try {
            this.logger.log(`[EVENT RECEIVED] employee.created | id: ${data.id}`);
            await this.notificationsService.handleEmployeeCreated(data);
            channel.ack(originalMsg);
        } catch (error) {
            this.logger.error(`Error handling employee.created: ${(error as Error).message}`);
            // Nack without requeue to avoid infinite loop on processing errors
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
            await this.notificationsService.handleEmployeeDeleted(data);
            channel.ack(originalMsg);
        } catch (error) {
            this.logger.error(`Error handling employee.deleted: ${(error as Error).message}`);
            channel.nack(originalMsg, false, false);
        }
    }

    @EventPattern('user.created')
    async handleUserCreated(
        @Payload() data: { email: string; token: string },
        @Ctx() context: RmqContext,
    ): Promise<void> {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        try {
            this.logger.log(`[NOTIFICACIÓN] Tipo: SEGURIDAD | Para: ${data.email} | Mensaje: Para establecer o recuperar su contraseña, utilice este enlace: https://app.empresa.com/reset?token=${data.token}`);
            channel.ack(originalMsg);
        } catch (error) {
            this.logger.error(`Error handling user.created: ${(error as Error).message}`);
            channel.nack(originalMsg, false, false);
        }
    }

    @EventPattern('user.recovered')
    async handleUserRecovered(
        @Payload() data: { email: string; token: string },
        @Ctx() context: RmqContext,
    ): Promise<void> {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        try {
            this.logger.log(`[NOTIFICACIÓN] Tipo: SEGURIDAD | Para: ${data.email} | Mensaje: Para establecer o recuperar su contraseña, utilice este enlace: https://app.empresa.com/reset?token=${data.token}`);
            channel.ack(originalMsg);
        } catch (error) {
            this.logger.error(`Error handling user.recovered: ${(error as Error).message}`);
            channel.nack(originalMsg, false, false);
        }
    }
}
