import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsConsumer } from './notifications.consumer';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Notification])],
    controllers: [NotificationsController, NotificationsConsumer],
    providers: [NotificationsService],
})
export class NotificationsModule { }
