import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { FindDepartmentsQueryDto } from './dto/find-departments-query.dto';
import { PaginatedDepartmentsDto } from './dto/paginated-departments.dto';
import { Department } from './entities/department.entity';

@ApiTags('departments')
@Controller('departments')
export class DepartmentsController {
    constructor(private readonly departmentsService: DepartmentsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new department' })
    @ApiResponse({ status: 201, description: 'Department created successfully.', type: Department })
    @ApiResponse({ status: 400, description: 'Invalid input data.' })
    create(@Body() createDepartmentDto: CreateDepartmentDto): Promise<Department> {
        return this.departmentsService.create(createDepartmentDto);
    }

    @Get()
    @ApiOperation({
        summary: 'List all departments',
        description: 'Returns a paginated list of departments. Optionally filter by name (partial, case-insensitive).',
    })
    @ApiQuery({ name: 'name', required: false, type: String, description: 'Filter by department name (partial, case-insensitive)', example: 'Tech' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts at 1)', example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page', example: 10 })
    @ApiResponse({ status: 200, description: 'Paginated list of departments with metadata.', type: PaginatedDepartmentsDto })
    findAll(@Query() query: FindDepartmentsQueryDto): Promise<PaginatedDepartmentsDto> {
        return this.departmentsService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a department by UUID' })
    @ApiParam({ name: 'id', description: 'Department UUID', type: 'string' })
    @ApiResponse({ status: 200, description: 'Department found.', type: Department })
    @ApiResponse({ status: 404, description: 'Department not found.' })
    findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Department> {
        return this.departmentsService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a department by UUID' })
    @ApiParam({ name: 'id', description: 'Department UUID', type: 'string' })
    @ApiResponse({ status: 200, description: 'Department updated.', type: Department })
    @ApiResponse({ status: 404, description: 'Department not found.' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDepartmentDto: UpdateDepartmentDto,
    ): Promise<Department> {
        return this.departmentsService.update(id, updateDepartmentDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a department by UUID' })
    @ApiParam({ name: 'id', description: 'Department UUID', type: 'string' })
    @ApiResponse({ status: 204, description: 'Department deleted.' })
    @ApiResponse({ status: 404, description: 'Department not found.' })
    remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        return this.departmentsService.remove(id);
    }
}
