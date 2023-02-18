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

    getGameOfUser = ({ userId }: { userId: number; }) => {
        return this.gameManagersOfPlayers.get(userId);
    };
}
