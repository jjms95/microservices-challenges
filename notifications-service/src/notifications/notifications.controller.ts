import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../security/jwt-auth.guard';
import { RolesGuard } from '../security/roles.guard';
import { Roles } from '../security/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    @Roles('USER', 'ADMIN')
    @ApiOperation({
        summary: 'List all notifications',
        description: 'Returns all notifications recorded by the service, ordered by most recent first.',
    })
    @ApiResponse({ status: 200, description: 'List of all notifications.', type: [Notification] })
    findAll(): Promise<Notification[]> {
        return this.notificationsService.findAll();
    }

    @Get(':employeeId')
    @Roles('USER', 'ADMIN')
    @ApiOperation({ summary: 'Get notifications for a specific employee' })
    @ApiParam({ name: 'employeeId', description: 'Employee UUID', type: 'string' })
    @ApiResponse({ status: 200, description: 'Notifications for the given employee.', type: [Notification] })
    findByEmployeeId(@Param('employeeId') employeeId: string): Promise<Notification[]> {
        return this.notificationsService.findByEmployeeId(employeeId);
    }
}
