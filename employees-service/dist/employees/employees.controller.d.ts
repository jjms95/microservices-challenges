import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { FindEmployeesQueryDto } from './dto/find-employees-query.dto';
import { PaginatedEmployeesDto } from './dto/paginated-employees.dto';
import { Employee } from './entities/employee.entity';
export declare class EmployeesController {
    private readonly employeesService;
    constructor(employeesService: EmployeesService);
    create(createEmployeeDto: CreateEmployeeDto): Promise<Employee>;
    findAll(query: FindEmployeesQueryDto): Promise<PaginatedEmployeesDto>;
    findOne(id: string): Promise<Employee>;
    remove(id: string): Promise<void>;
}
