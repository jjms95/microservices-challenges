import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Auth Service API')
    .setDescription('The identity provider and authentication endpoints')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Validation
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Connect to RabbitMQ to consume events (like employee.created)
  // We use fanout exchange if we want to follow 'employee_events_exchange' or just simple queue.
  // The challenge images didn't specify the exact exchange, but usually NestJS EventPattern fanout requires specific setup.
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672'],
      queue: 'auth_queue',
      queueOptions: {
        durable: true,
      },
      exchange: 'employees_exchange',
      exchangeType: 'fanout',
      noAck: true,
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 8085);
}
bootstrap();
