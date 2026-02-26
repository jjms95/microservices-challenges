import { IsString, IsEmail, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeDto {
    @ApiProperty({ example: 'John Doe', description: 'Full name of the employee' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'john.doe@company.com', description: 'Unique email address' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'uuid-dept-xxxx', description: 'UUID of the department (must exist in departments-service)' })
    @IsUUID()
    departmentId: string;

    @ApiProperty({ example: '2024-01-15', description: 'Hire date in ISO 8601 format' })
    @IsDateString()
    hireDate: string;
}
