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
      queue: 'profiles_queue',
      queueOptions: { durable: true },
      exchange: 'employees_exchange',
      exchangeType: 'fanout',
      noAck: false,
    },
  });

  // ── Swagger ──────────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Profiles Service API')
    .setDescription(
      'Microservice combining async event consumption and synchronous REST.\n\n' +
      '**Events consumed:**\n' +
      '- `employee.created` → auto-creates a default profile\n\n' +
      '**REST endpoints:** query and update employee profiles.',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.startAllMicroservices();
  await app.listen(8083);

  console.log('🚀 Profiles Service running on http://localhost:8083');
  console.log('📄 Swagger docs at http://localhost:8083/api');
  console.log('📨 Listening to RabbitMQ exchange: employees_exchange (queue: profiles_queue)');
}
bootstrap();
