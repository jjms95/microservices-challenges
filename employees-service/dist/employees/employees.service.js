"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EmployeesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const employee_entity_1 = require("./entities/employee.entity");
const circuit_breaker_service_1 = require("../resilience/circuit-breaker.service");
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;
let EmployeesService = EmployeesService_1 = class EmployeesService {
    employeesRepository;
    httpService;
    circuitBreaker;
    logger = new common_1.Logger(EmployeesService_1.name);
    constructor(employeesRepository, httpService, circuitBreaker) {
        this.employeesRepository = employeesRepository;
        this.httpService = httpService;
        this.circuitBreaker = circuitBreaker;
    }
    async create(createEmployeeDto) {
        const departmentsServiceUrl = process.env.DEPARTMENTS_SERVICE_URL || 'http://localhost:8081';
        if (!this.circuitBreaker.isAvailable()) {
            throw new common_1.ServiceUnavailableException('Departments service is currently unavailable (circuit breaker OPEN). Please try again later.');
        }
        try {
            await (0, rxjs_1.firstValueFrom)(this.httpService
                .get(`${departmentsServiceUrl}/departments/${createEmployeeDto.departmentId}`)
                .pipe((0, rxjs_1.retry)({
                count: MAX_RETRIES,
                delay: (error, retryCount) => {
                    if (error.response?.status === 404) {
                        return (0, rxjs_1.throwError)(() => error);
                    }
                    const delayMs = retryCount * RETRY_DELAY_MS;
                    this.logger.warn(`[CircuitBreaker: ${this.circuitBreaker.getState()}] ` +
                        `Retry ${retryCount}/${MAX_RETRIES} for departments-service in ${delayMs}ms...`);
                    return (0, rxjs_1.timer)(delayMs);
                },
                resetOnSuccess: true,
            })));
            this.circuitBreaker.onSuccess();
        }
        catch (error) {
            const axiosError = error;
            if (axiosError.response?.status === 404) {
                throw new common_1.BadRequestException(`Department with id "${createEmployeeDto.departmentId}" does not exist.`);
            }
            this.circuitBreaker.onFailure();
            this.logger.error(`Failed to reach departments-service after ${MAX_RETRIES} retries. ` +
                `Circuit breaker state: ${this.circuitBreaker.getState()}. ` +
                `Error: ${axiosError.message}`);
            throw new common_1.ServiceUnavailableException('Could not communicate with departments-service. The service may be temporarily unavailable.');
        }
        const employee = this.employeesRepository.create(createEmployeeDto);
        return this.employeesRepository.save(employee);
    }
    async findAll(query) {
        const { name, email, page = 1, limit = 10 } = query;
        const where = [];
        if (name && email) {
            where.push({ name: (0, typeorm_2.ILike)(`%${name}%`), email: (0, typeorm_2.ILike)(`%${email}%`) });
        }
        else if (name) {
            where.push({ name: (0, typeorm_2.ILike)(`%${name}%`) });
        }
        else if (email) {
            where.push({ email: (0, typeorm_2.ILike)(`%${email}%`) });
        }
        const [data, totalItems] = await this.employeesRepository.findAndCount({
            where: where.length > 0 ? where : undefined,
            skip: (page - 1) * limit,
            take: limit,
            order: { name: 'ASC' },
        });
        return {
            data,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
            itemsPerPage: limit,
        };
    }
    async findOne(id) {
        const employee = await this.employeesRepository.findOne({ where: { id } });
        if (!employee) {
            throw new common_1.NotFoundException(`Employee with id "${id}" not found.`);
        }
        return employee;
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = EmployeesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        axios_1.HttpService,
        circuit_breaker_service_1.CircuitBreakerService])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map