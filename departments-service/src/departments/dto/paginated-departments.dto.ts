import { ApiProperty } from '@nestjs/swagger';
import { Department } from '../entities/department.entity';

export class PaginatedDepartmentsDto {
    @ApiProperty({ type: [Department], description: 'List of departments for the current page' })
    data: Department[];

    @ApiProperty({ example: 1, description: 'Current page number' })
    currentPage: number;

    @ApiProperty({ example: 3, description: 'Total number of pages' })
    totalPages: number;

    @ApiProperty({ example: 25, description: 'Total number of departments matching the filters' })
    totalItems: number;

    @ApiProperty({ example: 10, description: 'Number of items per page' })
    itemsPerPage: number;
}
