import { ApiProperty } from '@nestjs/swagger';
import { Employee } from '../entities/employee.entity';

export class PaginatedEmployeesDto {
    @ApiProperty({ type: [Employee], description: 'List of employees for the current page' })
    data: Employee[];

    @ApiProperty({ example: 1, description: 'Current page number' })
    currentPage: number;

    @ApiProperty({ example: 5, description: 'Total number of pages' })
    totalPages: number;

    @ApiProperty({ example: 48, description: 'Total number of employees matching the filters' })
    totalItems: number;

    @ApiProperty({ example: 10, description: 'Number of items per page' })
    itemsPerPage: number;
}
