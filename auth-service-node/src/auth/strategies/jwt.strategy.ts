import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'supersecret2026'),
    });
  }

  async validate(payload: any) {
    // Standard access token validation
    if (payload.type === 'RESET_PASSWORD') {
      throw new UnauthorizedException('Reset token cannot be used for authentication');
    }
    const user = await this.usersRepository.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
