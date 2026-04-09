import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // ── Hybrid App: HTTP + RabbitMQ consumer ────────────────────────────────
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Connect to RabbitMQ fanout exchange as consumer
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672'],
      queue: 'notifications_queue',
      queueOptions: { durable: true },
      exchange: 'employees_exchange',
      exchangeType: 'fanout',
      noAck: false,
    },
  });

  // ── Swagger ──────────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Notifications Service API')
    .setDescription(
      'Reactive microservice that consumes RabbitMQ events and records notification history.\n\n' +
      '**Events consumed:**\n' +
      '- `employee.created` → sends WELCOME notification\n' +
      '- `employee.deleted` → sends OFFBOARDING notification',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.startAllMicroservices();
  await app.listen(8084);

  console.log('🚀 Notifications Service running on http://localhost:8084');
  console.log('📄 Swagger docs at http://localhost:8084/api');
  console.log('📨 Listening to RabbitMQ exchange: employees_exchange (queue: notifications_queue)');
}
bootstrap();
