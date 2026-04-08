const fs = require('fs');
const path = require('path');
const services = ['employees-service', 'departments-service', 'profiles-service', 'notifications-service'];

const jwtStrategyTemplate = `import { Injectable, UnauthorizedException } from '@nestjs/common';
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
}`;

const jwtAuthGuardTemplate = `import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = Reflect.getMetadata('isPublic', context.getHandler());
    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}`;

const rolesDecoratorTemplate = `import { SetMetadata } from '@nestjs/common';
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
export const Public = () => SetMetadata('isPublic', true);`;

const rolesGuardTemplate = `import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
    if (isPublic) return true;

    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true; // IF no roles specified, just being authenticated is enough
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;
    return roles.includes(user.role) || user.role === 'ADMIN';
  }
}`;

const securityModuleTemplate = `import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecret2026',
    }),
  ],
  providers: [JwtStrategy],
  exports: [PassportModule, JwtModule],
})
export class SecurityModule {}`;

services.forEach(s => {
  const securityPath = path.join(s, 'src', 'security');
  if (!fs.existsSync(securityPath)) fs.mkdirSync(securityPath, { recursive: true });
  
  fs.writeFileSync(path.join(securityPath, 'jwt.strategy.ts'), jwtStrategyTemplate);
  fs.writeFileSync(path.join(securityPath, 'jwt-auth.guard.ts'), jwtAuthGuardTemplate);
  fs.writeFileSync(path.join(securityPath, 'roles.decorator.ts'), rolesDecoratorTemplate);
  fs.writeFileSync(path.join(securityPath, 'roles.guard.ts'), rolesGuardTemplate);
  fs.writeFileSync(path.join(securityPath, 'security.module.ts'), securityModuleTemplate);
});
