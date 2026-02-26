import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('departments')
export class Department {
    @ApiProperty({ example: 'uuid-xxxx-xxxx', description: 'UUID auto-generated' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ example: 'Technology' })
    @Column({ unique: true })
    name: string;

    @ApiProperty({ example: 'Handles all software and infrastructure' })
    @Column({ nullable: true })
    description: string;
}
