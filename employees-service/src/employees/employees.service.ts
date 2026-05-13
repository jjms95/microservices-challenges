import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ServiceUnavailableException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, retry, timer, throwError } from 'rxjs';
import { AxiosError } from 'axios';
import { Employee } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { FindEmployeesQueryDto } from './dto/find-employees-query.dto';
import { PaginatedEmployeesDto } from './dto/paginated-employees.dto';
import { CircuitBreakerService } from '../resilience/circuit-breaker.service';
import { EventsPublisherService } from '../messaging/events-publisher.service';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

@Injectable()
export class EmployeesService {
    private readonly logger = new Logger(EmployeesService.name);

    constructor(
        @InjectRepository(Employee)
        private readonly employeesRepository: Repository<Employee>,
        private readonly httpService: HttpService,
        private readonly circuitBreaker: CircuitBreakerService,
        private readonly eventsPublisher: EventsPublisherService,
    ) { }

    async create(createEmployeeDto: CreateEmployeeDto, token?: string): Promise<Employee> {
        const departmentsServiceUrl =
            process.env.DEPARTMENTS_SERVICE_URL ?? 'http://localhost:8081';

        // ── Circuit Breaker: fast-fail if departments-service is known down ───
        if (!this.circuitBreaker.isAvailable()) {
            throw new ServiceUnavailableException(
                'Departments service is currently unavailable (circuit breaker OPEN). Please try again later.',
            );
        }

        // ── Validate department exists via HTTP REST (with retry) ─────────────
        try {
            await firstValueFrom(
                this.httpService
                    .get(`${departmentsServiceUrl}/departments/${createEmployeeDto.departmentId}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    })
                    .pipe(
                        retry({
                            count: MAX_RETRIES,
                            delay: (error: AxiosError, retryCount: number) => {
                                if (error.response?.status === 404) {
                                    return throwError(() => error);
                                }
                                const delayMs = retryCount * RETRY_DELAY_MS;
                                this.logger.warn(
                                    `[CircuitBreaker: ${this.circuitBreaker.getState()}] Retry ${retryCount}/${MAX_RETRIES} for departments-service in ${delayMs}ms...`,
                                );
                                return timer(delayMs);
                            },
                            resetOnSuccess: true,
                        }),
                    ),
            );
            this.circuitBreaker.onSuccess();
        } catch (error) {
            const axiosError = error as AxiosError;
            if (axiosError.response?.status === 404) {
                throw new BadRequestException(
                    `Department with id "${createEmployeeDto.departmentId}" does not exist.`,
                );
            }
            this.circuitBreaker.onFailure();
            this.logger.error(
                `Failed to reach departments-service after ${MAX_RETRIES} retries. ` +
                `Circuit breaker: ${this.circuitBreaker.getState()}. Error: ${axiosError.message}`,
            );
            throw new ServiceUnavailableException(
                'Could not communicate with departments-service. The service may be temporarily unavailable.',
            );
        }

        // ── Persist employee ──────────────────────────────────────────────────
        const employee = this.employeesRepository.create(createEmployeeDto);
        const saved = await this.employeesRepository.save(employee);

        // ── Publish event AFTER successful DB save (fire-and-forget) ─────────
        this.eventsPublisher.publishEmployeeCreated({
            id: saved.id,
            name: saved.name,
            email: saved.email,
            departmentId: saved.departmentId,
            hireDate: saved.hireDate,
        });

        return saved;
    }

    async findAll(query: FindEmployeesQueryDto): Promise<PaginatedEmployeesDto> {
        this.logger.debug(`Executing findAll with query params: ${JSON.stringify(query)}`);
        const { name, email, page = 1, limit = 10 } = query;

        const queryBuilder = this.employeesRepository.createQueryBuilder('employee');

        if (name && email) {
            this.logger.debug(`Filtering by both name (${name}) and email (${email})`);
            queryBuilder.where('employee.name ILIKE :name', { name: `%${name}%` })
                .andWhere('employee.email ILIKE :email', { email: `%${email}%` });
        } else if (name) {
            this.logger.debug(`Filtering by name only (${name})`);
            queryBuilder.where('employee.name ILIKE :name', { name: `%${name}%` });
        } else if (email) {
            this.logger.debug(`Filtering by email only (${email})`);
            queryBuilder.where('employee.email ILIKE :email', { email: `%${email}%` });
        } else {
            this.logger.debug(`No filters applied, fetching all employees`);
        }

        queryBuilder.orderBy('employee.name', 'ASC');
        queryBuilder.skip((page - 1) * limit);
        queryBuilder.take(limit);

        const [data, totalItems] = await queryBuilder.getManyAndCount();

        this.logger.debug(`Found ${totalItems} employees total. Returning page ${page} with ${data.length} items`);

        return {
            data,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
            itemsPerPage: limit,
        };
    }

    async findOne(id: string): Promise<Employee> {
        const employee = await this.employeesRepository.findOne({ where: { id } });
        if (!employee) {
            throw new NotFoundException(`Employee with id "${id}" not found.`);
        }
        return employee;
    }

    async remove(id: string): Promise<void> {
        const employee = await this.findOne(id); // throws 404 if not found

        // ── Delete from DB ────────────────────────────────────────────────────
        await this.employeesRepository.remove(employee);
        this.logger.log(`Employee ${id} deleted from database.`);

        // ── Publish event AFTER successful deletion (fire-and-forget) ─────────
        this.eventsPublisher.publishEmployeeDeleted({
            id,
            name: employee.name,
            email: employee.email,
        });
    }
}
