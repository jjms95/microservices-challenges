import './tracing'; // Must be first
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { trace } from '@opentelemetry/api';

const customFormat = winston.format((info) => {
  info.service = 'departments-service';
  
  const span = trace.getActiveSpan();
  if (span) {
    info.traceId = span.spanContext().traceId;
  }
  
  return info;
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        customFormat(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console()
      ]
    })
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Departments Service API')
    .setDescription('REST API for managing departments')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(8081);
  console.log('🚀 Departments Service running on http://localhost:8081');
  console.log('📄 Swagger docs at http://localhost:8081/api');
}
bootstrap();
