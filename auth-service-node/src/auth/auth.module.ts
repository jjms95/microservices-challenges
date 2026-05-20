import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { UsersConsumer } from './users.consumer';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SeedService } from './seed/seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'supersecret2026'),
      }),
      inject: [ConfigService],
    }),
    ClientsModule.registerAsync([
      {
        name: 'AUTH_EVENTS',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL', 'amqp://admin:admin@localhost:5672')],
            queue: 'auth_queue',
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'EVENT_EXCHANGE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL', 'amqp://admin:admin@localhost:5672')],
            queue: 'auth_publish_queue',
            queueOptions: { durable: true },
            exchange: 'employees_exchange',
            exchangeType: 'fanout',
          },
        }),
        inject: [ConfigService],
      }
    ]),
  ],
  controllers: [AuthController, UsersConsumer],
  providers: [AuthService, JwtStrategy, SeedService],
  exports: [AuthService],
})
export class AuthModule {}
