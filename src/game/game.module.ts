import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';

@Module({
  imports: [AuthModule, UsersModule],
  providers: [GameGateway, GameService],
  exports: [GameService]
})
export class GameModule { }
