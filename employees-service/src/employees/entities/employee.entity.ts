import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('employees')
export class Employee {
    @ApiProperty({ example: 'uuid-xxxx-xxxx', description: 'UUID auto-generated' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ example: 'John Doe' })
    @Column()
    name: string;

    @ApiProperty({ example: 'john.doe@company.com' })
    @Column({ unique: true })
    email: string;

    @ApiProperty({ example: 'uuid-dept-xxxx', description: 'Department UUID (validated via REST)' })
    @Column()
    departmentId: string;

    @ApiProperty({ example: '2024-01-15' })
    @Column({ type: 'date' })
    hireDate: Date;
}
