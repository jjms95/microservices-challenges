import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('profiles')
export class Profile {
    @ApiProperty({ example: 'uuid-xxxx', description: 'UUID auto-generated' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ example: 'uuid-employee-xxxx', description: 'Employee UUID (unique)' })
    @Column({ unique: true })
    employeeId: string;

    @ApiProperty({ example: 'John Doe' })
    @Column()
    name: string;

    @ApiProperty({ example: 'john.doe@company.com' })
    @Column()
    email: string;

    @ApiProperty({ example: '+57 300 123 4567', default: '' })
    @Column({ default: '' })
    phone: string;

    @ApiProperty({ example: 'Calle 123 #45-67', default: '' })
    @Column({ default: '' })
    address: string;

    @ApiProperty({ example: 'Bogotá', default: '' })
    @Column({ default: '' })
    city: string;

    @ApiProperty({ example: 'Software engineer with 5 years of experience.', default: '' })
    @Column({ type: 'text', default: '' })
    biography: string;

    @ApiProperty({ description: 'Profile creation timestamp' })
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
