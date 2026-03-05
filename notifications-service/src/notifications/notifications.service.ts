import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

export interface EmployeeCreatedPayload {
    id: string;
    name: string;
    email: string;
    departmentId: string;
    hireDate: Date;
}

export interface EmployeeDeletedPayload {
    id: string;
    name: string;
    email: string;
}

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectRepository(Notification)
        private readonly notificationsRepository: Repository<Notification>,
    ) { }

    async handleEmployeeCreated(payload: EmployeeCreatedPayload): Promise<void> {
        const message = `Welcome ${payload.name}! Your employee account has been successfully created. We are glad to have you on board.`;

        const notification = this.notificationsRepository.create({
            type: NotificationType.WELCOME,
            recipient: payload.email,
            message,
            employeeId: payload.id,
        });

        await this.notificationsRepository.save(notification);

        // Structured log as required by the PDF
        this.logger.log(
            `[NOTIFICATION] Type: WELCOME | To: ${payload.email} | Message: "${message}"`,
        );
    }

    async handleEmployeeDeleted(payload: EmployeeDeletedPayload): Promise<void> {
        const message = `Dear ${payload.name}, your employee account has been deactivated. If you have any questions, please contact HR.`;

        const notification = this.notificationsRepository.create({
            type: NotificationType.OFFBOARDING,
            recipient: payload.email,
            message,
            employeeId: payload.id,
        });

        await this.notificationsRepository.save(notification);

        // Structured log as required by the PDF
        this.logger.log(
            `[NOTIFICATION] Type: OFFBOARDING | To: ${payload.email} | Message: "${message}"`,
        );
    }

    findAll(): Promise<Notification[]> {
        return this.notificationsRepository.find({ order: { sentAt: 'DESC' } });
    }

    findByEmployeeId(employeeId: string): Promise<Notification[]> {
        return this.notificationsRepository.find({
            where: { employeeId },
            order: { sentAt: 'DESC' },
        });
    }
}
