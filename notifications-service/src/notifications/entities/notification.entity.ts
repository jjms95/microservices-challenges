import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum NotificationType {
    WELCOME = 'WELCOME',
    OFFBOARDING = 'OFFBOARDING',
}

@Entity('notifications')
export class Notification {
    @ApiProperty({ example: 'uuid-xxxx', description: 'UUID auto-generated' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ enum: NotificationType, example: NotificationType.WELCOME })
    @Column({ type: 'enum', enum: NotificationType })
    type: NotificationType;

    @ApiProperty({ example: 'john.doe@company.com', description: 'Employee email (recipient)' })
    @Column()
    recipient: string;

    @ApiProperty({ example: 'Welcome John Doe! Your account has been created.' })
    @Column('text')
    message: string;

    @ApiProperty({ example: 'uuid-employee-xxxx' })
    @Column()
    employeeId: string;

    @ApiProperty({ description: 'Timestamp when the notification was sent' })
    @CreateDateColumn({ name: 'sent_at' })
    sentAt: Date;
}
