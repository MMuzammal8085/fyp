import {
    Body,
    Controller,
    Post,
    UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { LoginDto } from './auth.dto';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';


@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) {}

    @Post('login')
    async login(@Body() dto: LoginDto) {
        const email = dto.email.toLowerCase().trim();

        // 🔍 find user
        const user = await this.userService.findOne({
            where: { email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // 🔐 password check
        const isMatch = await bcrypt.compare(
            dto.password,
            user.password,
        );

        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // 🚨 check verified
        if (!user.isActive) {
            throw new UnauthorizedException(
                'Please verify your email first',
            );
        }

        // 🎟️ generate token
        const payload = {
            sub: user._id,
            role: user.role,
        };

        const accessToken = await this.jwtService.signAsync(payload);

        // 💾 save auth session
        const authRecord = this.authService.create({
            userId: user._id,
            accessToken,
            isValid: true,
        });

        await this.authService.save(authRecord);

     

        return {
            message: 'Login successful',
            access_token: accessToken
        };
    }
}