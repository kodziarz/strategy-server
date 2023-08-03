import { Injectable } from '@nestjs/common';
import Game from 'src/dataClasses/Game';
import User from 'src/dataClasses/User';
import { GameGateway } from './game.gateway';

@Injectable()
export class GameService {

    /**Contains game managers of all current played games. */
    private gameManagers: Game[] = [];

    private gameGateway: GameGateway;

    constructor() { }

    createNewGame = (): Game => {
        let game = new Game(
            this.gameGateway
        );
        this.gameManagers.push(game);
        return game;
    };

    addUserToGame = (user: User) => {
        for (const game of this.gameManagers) {
            if (game.isWaiting) {
                game.addPlayer(user);
                user.currentGame = game;
            }
            return;
        }
        let game = this.createNewGame();
        game.addPlayer(user);
        user.currentGame = game;
    };

    setGameGateway = (gameGateway: GameGateway) => {
        this.gameGateway = gameGateway;
    };
}
