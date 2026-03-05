import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { Employee } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { FindEmployeesQueryDto } from './dto/find-employees-query.dto';
import { PaginatedEmployeesDto } from './dto/paginated-employees.dto';
import { CircuitBreakerService } from '../resilience/circuit-breaker.service';
import { EventsPublisherService } from '../messaging/events-publisher.service';
export declare class EmployeesService {
    private readonly employeesRepository;
    private readonly httpService;
    private readonly circuitBreaker;
    private readonly eventsPublisher;
    private readonly logger;
    constructor(employeesRepository: Repository<Employee>, httpService: HttpService, circuitBreaker: CircuitBreakerService, eventsPublisher: EventsPublisherService);
    create(createEmployeeDto: CreateEmployeeDto): Promise<Employee>;
    findAll(query: FindEmployeesQueryDto): Promise<PaginatedEmployeesDto>;
    findOne(id: string): Promise<Employee>;
    remove(id: string): Promise<void>;
}
