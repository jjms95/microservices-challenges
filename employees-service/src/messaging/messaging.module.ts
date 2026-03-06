import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventsPublisherService } from './events-publisher.service';

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: 'EMPLOYEE_EVENTS',
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (config: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [config.get<string>('RABBITMQ_URL', 'amqp://admin:admin@localhost:5672')],
                        // Publisher only: no queue needed — we publish to the fanout exchange.
                        // noAck: true is required on the CLIENT side because ClientRMQ
                        // creates an internal reply-queue consumer for request-response (send()).
                        // That consumer cannot use manual ack (noAck: false) — RabbitMQ
                        // rejects it with PRECONDITION_FAILED.
                        // Since we only use emit() (fire-and-forget), noAck: true is correct.
                        queue: 'employees_publisher_queue',
                        queueOptions: { durable: true },
                        exchange: 'employees_exchange',
                        exchangeType: 'fanout',
                        noAck: true,
                        persistent: true,
                    },
                }),
            },
        ]),
    ],
    providers: [EventsPublisherService],
    exports: [EventsPublisherService],
})
export class MessagingModule { }
