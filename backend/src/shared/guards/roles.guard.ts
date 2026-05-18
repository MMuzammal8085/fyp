import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { ROLES_KEY } from 'src/shared/decorators/roles.decorator';
import { UserType } from 'src/shared/enums/user.enums';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  private normalizeRole(role: any): UserType | undefined {
    if (typeof role === 'number') return role as UserType;
    if (typeof role === 'string') {
      const byName = (UserType as any)[role];
      if (typeof byName === 'number') return byName as UserType;
      const asNumber = Number(role);
      if (!Number.isNaN(asNumber)) return asNumber as UserType;
    }
    return undefined;
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request?.user;

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const userRole = this.normalizeRole(user.role);
    if (userRole === undefined || !requiredRoles.includes(userRole)) {
      throw new ForbiddenException('Forbidden');
    }

    return true;
  }
}
