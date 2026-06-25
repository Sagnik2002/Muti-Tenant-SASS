import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums';
import { ROLES_KEY } from '../decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.orgRole) {
      throw new ForbiddenException('No role assigned in this organization');
    }

    const hasRole = requiredRoles.includes(user.orgRole);
    if (!hasRole) {
      throw new ForbiddenException(
        `Requires one of roles: ${requiredRoles.join(', ')}. Your role: ${user.orgRole}`,
      );
    }

    return true;
  }
}
