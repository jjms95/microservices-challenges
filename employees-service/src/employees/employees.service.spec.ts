import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesService } from './employees.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { HttpService } from '@nestjs/axios';
import { CircuitBreakerService } from '../resilience/circuit-breaker.service';
import { EventsPublisherService } from '../messaging/events-publisher.service';

describe('EmployeesService - findAll', () => {
    let service: EmployeesService;

    const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: '1', name: 'Jhon' }], 1]),
    };

    const mockRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EmployeesService,
                { provide: getRepositoryToken(Employee), useValue: mockRepository },
                { provide: HttpService, useValue: {} },
                { provide: CircuitBreakerService, useValue: {} },
                { provide: EventsPublisherService, useValue: {} },
            ],
        }).compile();

        service = module.get<EmployeesService>(EmployeesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should query without filters', async () => {
        const result = await service.findAll({});
        expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
        expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
        expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
        expect(result.totalItems).toBe(1);
    });

    it('should query by name only', async () => {
        await service.findAll({ name: 'Jhon' });
        expect(mockQueryBuilder.where).toHaveBeenCalledWith('employee.name ILIKE :name', { name: '%Jhon%' });
    });

    it('should query by email only', async () => {
        await service.findAll({ email: 'test@company.com' });
        expect(mockQueryBuilder.where).toHaveBeenCalledWith('employee.email ILIKE :email', { email: '%test@company.com%' });
    });

    it('should query by both name and email', async () => {
        await service.findAll({ name: 'Jhon', email: 'test@company.com' });
        expect(mockQueryBuilder.where).toHaveBeenCalledWith('employee.name ILIKE :name', { name: '%Jhon%' });
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('employee.email ILIKE :email', { email: '%test@company.com%' });
    });
});
