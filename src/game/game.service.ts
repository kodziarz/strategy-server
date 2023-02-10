import { Injectable } from '@nestjs/common';
import GameManager from 'src/dataClasses/GamesManager';
import User from 'src/dataClasses/User';

@Injectable()
export class GameService {

    /**Contains game managers of all current played games. */
    private gameManagers: GameManager[] = [];

    /**Maps {@link GameManager | GameManagers} to {@link User | User's} ids. */
    private gameManagersOfPlayers: Map<number, GameManager>;

    constructor() {
        this.gameManagersOfPlayers = new Map();
    }

    // createNewGame = () => {
    //     this.gameManagers.push(new GameManager());
    // };

    addUserToGame = (user: User) => {
        this.gameManagers.every((gameManager) => {
            if (gameManager.isWaiting) {
                gameManager.addPlayer(user);
                this.gameManagersOfPlayers.set(user.id, gameManager);
            }
        });
    };

    getGameManagerOfUser = ({ userId }: { userId: number; }) => {
        return this.gameManagersOfPlayers.get(userId);
    };
}
