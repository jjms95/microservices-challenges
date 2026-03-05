import { Controller, Get, Post, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { FindEmployeesQueryDto } from './dto/find-employees-query.dto';
import { PaginatedEmployeesDto } from './dto/paginated-employees.dto';
import { Employee } from './entities/employee.entity';

@ApiTags('employees')
@Controller('employees')
export class EmployeesController {
    constructor(private readonly employeesService: EmployeesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new employee', description: 'Validates department via REST, saves employee, then publishes employee.created event to RabbitMQ.' })
    @ApiResponse({ status: 201, description: 'Employee created. Event employee.created published.', type: Employee })
    @ApiResponse({ status: 400, description: 'Invalid input or department not found.' })
    @ApiResponse({ status: 503, description: 'departments-service unreachable (circuit breaker or timeout).' })
    create(@Body() createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
        return this.employeesService.create(createEmployeeDto);
    }

    @Get()
    @ApiOperation({
        summary: 'List all employees',
        description: 'Returns a paginated list of employees. Optionally filter by name and/or email (partial, case-insensitive).',
    })
    @ApiQuery({ name: 'name', required: false, type: String, description: 'Filter by name (partial, case-insensitive)', example: 'John' })
    @ApiQuery({ name: 'email', required: false, type: String, description: 'Filter by email (partial, case-insensitive)', example: 'john@company.com' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts at 1)', example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 10 })
    @ApiResponse({ status: 200, description: 'Paginated list of employees.', type: PaginatedEmployeesDto })
    findAll(@Query() query: FindEmployeesQueryDto): Promise<PaginatedEmployeesDto> {
        return this.employeesService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get an employee by UUID' })
    @ApiParam({ name: 'id', description: 'Employee UUID', type: 'string' })
    @ApiResponse({ status: 200, description: 'Employee found.', type: Employee })
    @ApiResponse({ status: 404, description: 'Employee not found.' })
    findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Employee> {
        return this.employeesService.findOne(id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Delete an employee by UUID',
        description: 'Deletes the employee from the database and publishes employee.deleted event to RabbitMQ.',
    })
    @ApiParam({ name: 'id', description: 'Employee UUID', type: 'string' })
    @ApiResponse({ status: 204, description: 'Employee deleted. Event employee.deleted published.' })
    @ApiResponse({ status: 404, description: 'Employee not found.' })
    remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        return this.employeesService.remove(id);
    }
}
