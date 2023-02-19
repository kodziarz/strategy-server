import { Injectable } from '@nestjs/common';
import Game from 'src/dataClasses/Game';
import User from 'src/dataClasses/User';

@Injectable()
export class GameService {

    /**Contains game managers of all current played games. */
    private gameManagers: Game[] = [];

    /**Maps {@link Game | GameManagers} to {@link User | User's} ids. */
    private gameManagersOfPlayers: Map<number, Game>;

    constructor() {
        this.gameManagersOfPlayers = new Map();
    }

    createNewGame = (): Game => {
        let game = new Game();
        this.gameManagers.push(game);
        return game;
    };

    addUserToGame = (user: User) => {
        for (const game of this.gameManagers) {
            if (game.isWaiting) {
                game.addPlayer(user);
                this.gameManagersOfPlayers.set(user.id, game);
            }
            return;
        }
        let game = this.createNewGame();
        game.addPlayer(user);
        this.gameManagersOfPlayers.set(user.id, game);
    };

    getGameOfUser = (userId: number) => {
        return this.gameManagersOfPlayers.get(userId);
    };
}
