import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    @ApiOperation({
        summary: 'List all notifications',
        description: 'Returns all notifications recorded by the service, ordered by most recent first.',
    })
    @ApiResponse({ status: 200, description: 'List of all notifications.', type: [Notification] })
    findAll(): Promise<Notification[]> {
        return this.notificationsService.findAll();
    }

    @Get(':employeeId')
    @ApiOperation({ summary: 'Get notifications for a specific employee' })
    @ApiParam({ name: 'employeeId', description: 'Employee UUID', type: 'string' })
    @ApiResponse({ status: 200, description: 'Notifications for the given employee.', type: [Notification] })
    findByEmployeeId(@Param('employeeId') employeeId: string): Promise<Notification[]> {
        return this.notificationsService.findByEmployeeId(employeeId);
    }
}
