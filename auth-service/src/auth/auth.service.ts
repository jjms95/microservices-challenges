import { BadRequestException, Injectable, Inject, NotFoundException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private jwtService: JwtService,
    @Inject('EVENT_EXCHANGE') private publisher: ClientProxy,
  ) {}

  async onModuleInit() {
    await this.publisher.connect();
  }

  async login(loginDto: any) {
    const { email, password } = loginDto;
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials or inactive user');
    }

    if (!user.password) {
      throw new UnauthorizedException('Please reset your password before logging in');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '1h' }),
    };
  }

  async recoverPassword(email: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user || !user.isActive) {
      throw new NotFoundException('User not found or inactive');
    }

    const payload = { sub: user.id, type: 'RESET_PASSWORD' };
    const resetToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    // Emit event for notification
    this.publisher.emit('user.recovered', {
      email: user.email,
      token: resetToken,
    });
    this.logger.log(`Emitted user.recovered for ${user.email}`);

    return { message: 'Recovery email simulated' };
  }

  async resetPassword(resetDto: any) {
    const { token, newPassword } = resetDto;

    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'RESET_PASSWORD') {
        throw new BadRequestException('Invalid token type');
      }

      const user = await this.usersRepository.findOne({ where: { id: payload.sub } });
      if (!user) throw new NotFoundException('User not found');

      const salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(newPassword, salt);
      await this.usersRepository.save(user);

      return { message: 'Password updated successfully' };
    } catch (e) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async handleEmployeeCreated(data: any) {
    // Check if user exists
    let user = await this.usersRepository.findOne({ where: { email: data.email } });
    if (!user) {
      user = this.usersRepository.create({
         email: data.email,
         role: UserRole.USER,
         isActive: true,
      });
      await this.usersRepository.save(user);
    }
    
    // Generate reset token as they have no password
    const payload = { sub: user.id, type: 'RESET_PASSWORD' };
    const resetToken = this.jwtService.sign(payload, { expiresIn: '2h' });

    this.publisher.emit('user.created', {
      email: user.email,
      token: resetToken,
    });
    this.logger.log(`Created user ${user.email} from employee and emitted user.created`);
  }

  async handleEmployeeDeleted(data: any) {
    const user = await this.usersRepository.findOne({ where: { email: data.email } });
    if (user) {
      user.isActive = false;
      await this.usersRepository.save(user);
      this.logger.log(`Deactivated user ${user.email} from employee deleted`);
    }
  }
}
