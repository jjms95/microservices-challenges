import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { Employee } from './entities/employee.entity';
import { CircuitBreakerService } from '../resilience/circuit-breaker.service';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Employee]),
        HttpModule.register({ timeout: 5000, maxRedirects: 3 }),
        MessagingModule,
    ],
    controllers: [EmployeesController],
    providers: [EmployeesService, CircuitBreakerService],
})
export class EmployeesModule { }
