import { BadRequestException, Body, Controller, Delete, Get, Logger, NotFoundException, Param, ParseUUIDPipe, Post, Put, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { LocalAuthGuard } from './auth/guards/local-auth.guard';
import User from './dataClasses/User';
import { GameService } from './game/game.service';

@Controller()
export class AppController {
  constructor(
    private readonly authService: AuthService,
    private readonly gameService: GameService
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

  @UseGuards(JwtAuthGuard)
  @Get("joinGame")
  async joinGame(@Request() req): Promise<string> {
    this.gameService.addUserToGame(req.user);
    let game = this.gameService.getGameOfUser(req.user);

    return "xd"; //TODO
  }
}
