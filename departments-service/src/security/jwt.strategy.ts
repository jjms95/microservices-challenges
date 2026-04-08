import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'supersecret2026',
    });
  }

  async validate(payload: any) {
    if (payload.type === 'RESET_PASSWORD') throw new UnauthorizedException('Invalid token usage');
    return { id: payload.sub, role: payload.role };
  }
}