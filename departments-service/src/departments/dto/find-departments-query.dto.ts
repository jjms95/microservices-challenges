import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FindDepartmentsQueryDto {
    @ApiPropertyOptional({ example: 'Tech', description: 'Filter by department name (partial, case-insensitive)' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({ example: 1, description: 'Page number (starts at 1)', default: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number = 1;

    @ApiPropertyOptional({ example: 10, description: 'Number of items per page', default: 10 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    limit?: number = 10;
}
