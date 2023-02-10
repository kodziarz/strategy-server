import { BadRequestException, Body, Controller, Delete, Get, Logger, NotFoundException, Param, ParseUUIDPipe, Post, Put, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { LocalAuthGuard } from './auth/guards/local-auth.guard';
import User from './dataClasses/User';

@Controller()
export class AppController {
  constructor(
    private readonly authService: AuthService
  ) { }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.generateToken(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get("renewJWT")
  async renewJWT(@Request() req) {
    return this.authService.generateToken(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get("user")
  async user(@Request() req): Promise<User> {
    return req.user;
  }
}
