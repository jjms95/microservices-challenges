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
                        queue: 'employees_publisher_queue',
                        queueOptions: { durable: true },
                        exchange: 'employees_exchange',
                        exchangeType: 'fanout',
                        noAck: false,
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
