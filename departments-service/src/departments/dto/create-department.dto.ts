import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepartmentDto {
    @ApiProperty({ example: 'Technology', description: 'Unique name of the department' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: 'Handles all software and infrastructure' })
    @IsString()
    @IsOptional()
    description?: string;
}
