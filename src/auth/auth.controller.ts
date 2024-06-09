import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from "src/dto";

@Controller('auth')
export class AuthController {
    // private authService: AuthService;
    // constructor(authService: AuthService) {
    //     this.authService = authService;
    // }

    constructor(private authService: AuthService) { }

    @Get('health')
    health() {
        return {
            health: 'ok'
        }
    }

    @Post('signup')
    signup(@Body() dto: AuthDto) {
        return this.authService.signup(dto);
    }

    @Post('signin')
    signin(@Body() dto: AuthDto) {
        return this.authService.signin(dto);
    }
}
