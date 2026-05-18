// src/shared/middleware/jwt.middleware.ts
import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from 'src/modules/auth/auth.service';

@Injectable()
export class JWTMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  private isPublicRoute(req: Request): boolean {
    // Normalize path: remove querystring, leading/trailing slashes
    const rawPath = (req.originalUrl || req.url || '').split('?')[0];
    const normalizedPath = rawPath.replace(/^\/+/, '').replace(/\/+$/, '');

    // Public endpoints (no JWT required). Allow optional prefixes like `api/...`.
    const publicRoutePatterns: RegExp[] = [
      /(^|\/)+auth\/login$/,
      /(^|\/)+user\/signup$/,
      /(^|\/)+user\/verify-otp$/,
      /(^|\/)+public\/interview-invites(\/.*)?$/,
    ];

    return publicRoutePatterns.some((pattern) => pattern.test(normalizedPath));
  }

  async use(req: Request & { user?: any }, res: Response, next: NextFunction) {
    if (req.method === 'OPTIONS') {
      return next();
    }

    if (this.isPublicRoute(req)) {
      return next();
    }

    const authHeader = req.headers.authorization;

    // 1. Check header
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedException('Authorization token missing');
    }

    // 2. Extract token
    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new UnauthorizedException('Authorization token missing');
    }

    try {
      // 3. Verify token
      const secret =
        this.configService.get<string>('JWT_SECRET') ??
        process.env.JWT_SECRET ??
        'FYP_SECRET_KEY';

      const payload = await this.jwtService.verifyAsync(token, { secret });

      // Optional-but-recommended: ensure token is an active session in DB.
      const session = await this.authService.findOne({
        where: { accessToken: token, isValid: true } as any,
      });
      if (!session) {
        throw new UnauthorizedException('Session is not valid');
      }

      // 4. Attach user to request
      req.user = payload;

      return next();
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
