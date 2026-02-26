import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
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
    @ApiOperation({ summary: 'Create a new employee', description: 'Validates department existence before saving' })
    @ApiResponse({ status: 201, description: 'Employee created successfully.', type: Employee })
    @ApiResponse({ status: 400, description: 'Invalid input or department not found.' })
    create(@Body() createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
        return this.employeesService.create(createEmployeeDto);
    }

    @Get()
    @ApiOperation({
        summary: 'List all employees',
        description: 'Returns a paginated list of employees. Optionally filter by name and/or email (partial, case-insensitive).',
    })
    @ApiQuery({ name: 'name', required: false, type: String, description: 'Filter by employee name (partial, case-insensitive)', example: 'John' })
    @ApiQuery({ name: 'email', required: false, type: String, description: 'Filter by employee email (partial, case-insensitive)', example: 'john@company.com' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts at 1)', example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page', example: 10 })
    @ApiResponse({
        status: 200,
        description: 'Paginated list of employees with metadata.',
        type: PaginatedEmployeesDto,
    })
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
}
