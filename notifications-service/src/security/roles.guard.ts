import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
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
}