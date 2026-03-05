import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

export interface EmployeeCreatedPayload {
    id: string;
    name: string;
    email: string;
    departmentId: string;
    hireDate: Date;
}

export interface EmployeeDeletedPayload {
    id: string;
    name: string;
    email: string;
}

@Injectable()
export class EventsPublisherService implements OnModuleInit {
    private readonly logger = new Logger(EventsPublisherService.name);

    constructor(
        @Inject('EMPLOYEE_EVENTS') private readonly client: ClientProxy,
    ) { }

    async onModuleInit(): Promise<void> {
        // Eagerly connect so first event doesn't get lost
        try {
            await this.client.connect();
            this.logger.log('Connected to RabbitMQ (employees_exchange)');
        } catch (error) {
            this.logger.warn(`RabbitMQ initial connection failed: ${(error as Error).message}. Will retry on first emit.`);
        }
    }

    /**
     * Publishes 'employee.created' event to the fanout exchange.
     * Fire-and-forget: errors are logged but never bubble up to the caller.
     */
    publishEmployeeCreated(payload: EmployeeCreatedPayload): void {
        this.client.emit('employee.created', payload).subscribe({
            error: (err: Error) =>
                this.logger.error(`Failed to publish employee.created: ${err.message}`),
        });
        this.logger.log(`[EVENT PUBLISHED] employee.created | id: ${payload.id}`);
    }

    /**
     * Publishes 'employee.deleted' event to the fanout exchange.
     * Fire-and-forget: errors are logged but never bubble up to the caller.
     */
    publishEmployeeDeleted(payload: EmployeeDeletedPayload): void {
        this.client.emit('employee.deleted', payload).subscribe({
            error: (err: Error) =>
                this.logger.error(`Failed to publish employee.deleted: ${err.message}`),
        });
        this.logger.log(`[EVENT PUBLISHED] employee.deleted | id: ${payload.id}`);
    }
}
