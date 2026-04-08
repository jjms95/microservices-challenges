import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';

@Controller()
export class UsersConsumer {
  private readonly logger = new Logger(UsersConsumer.name);

  constructor(private readonly authService: AuthService) {}

  @EventPattern('employee.created')
  async handleEmployeeCreated(@Payload() data: any) {
    this.logger.log(`Received employee.created event for ${data?.email}`);
    await this.authService.handleEmployeeCreated(data);
  }

  @EventPattern('employee.deleted')
  async handleEmployeeDeleted(@Payload() data: any) {
    this.logger.log(`Received employee.deleted event for ${data?.email}`);
    await this.authService.handleEmployeeDeleted(data);
  }
}
