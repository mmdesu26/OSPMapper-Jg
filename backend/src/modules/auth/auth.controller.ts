// auth.controller.ts
import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto }    from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) { return this.auth.login(dto); }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Request() req: any) { return this.auth.logout(req.user.sub); }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  profile(@Request() req: any) { return this.auth.getProfile(req.user.sub); }
}
