import { Injectable } from '@nestjs/common';
import Game from 'src/dataClasses/Game';
import Building from 'src/dataClasses/game/Building';
import MapField from 'src/dataClasses/game/MapField';
import Player from 'src/dataClasses/Player';
import User from 'src/dataClasses/User';
import { GameGateway } from './game.gateway';

@Injectable()
export class GameService {

    /**Contains game managers of all current played games. */
    private gameManagers: Game[] = [];

    /**Maps {@link Game | GameManagers} to {@link User | User's} ids. */
    private gameManagersOfPlayers: Map<number, Game>;

    private handleObservedMapFieldChanged: (player: Player, changedFields: MapField[]) => void;
    private handleBuildingChanged: (player: Player, changedBuildings: Building[]) => void;


    constructor() {
        this.gameManagersOfPlayers = new Map();
    }

    createNewGame = (): Game => {
        let game = new Game(
            this.handleObservedMapFieldChanged,
            this.handleBuildingChanged
        );
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

    setGameHandlers = (
        handleObservedMapFieldChanged: (player: Player, changedFields: MapField[]) => void,
        handleBuildingChanged: (player: Player, changedBuildings: Building[]) => void
    ) => {
        this.handleObservedMapFieldChanged = handleObservedMapFieldChanged;
        this.handleBuildingChanged = handleBuildingChanged;
    };
}
