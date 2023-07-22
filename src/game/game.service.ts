import { Injectable } from '@nestjs/common';
import Game from 'src/dataClasses/Game';
import Building from './../../../strategy-common/dataClasses/Building';
import MapField from './../../../strategy-common/dataClasses/MapField';
import Player from 'src/dataClasses/Player';
import User from 'src/dataClasses/User';
import { GameGateway } from './game.gateway';
import FieldsTypes from './../../../strategy-common/dataClasses/mapFields/FieldsTypes';
import Grassland from './../../../strategy-common/dataClasses/mapFields/Grassland';
import BuildingsTypes from './../../../strategy-common/dataClasses/buildings/BuildingsTypes';
import MainBuilding from './../../../strategy-common/dataClasses/buildings/MainBuilding';

@Injectable()
export class GameService {

    /**Contains game managers of all current played games. */
    private gameManagers: Game[] = [];

    /**Maps {@link Game | GameManagers} to {@link User | User's} ids. */
    private gameManagersOfPlayers: Map<number, Game>;

    private gameGateway: GameGateway;

    constructor() {
        this.gameManagersOfPlayers = new Map();
    }

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

    setGameGateway = (gameGateway: GameGateway) => {
        this.gameGateway = gameGateway;
    };

    /**
     * Converts raw {@link MapField | MapField's} data to instance of specific
     * {@link MapField}.
     * @param mapFieldData Converted {@link MapField | MapField's} data.
     * @returns Specific subclass of {@link MapField}.
     */
    instantiateMapField(mapFieldData: MapField): MapField {
        switch (mapFieldData.type) {
            case FieldsTypes.GRASSLAND:
                return Object.assign(new Grassland(-1, -1), mapFieldData);
                break;
            default: throw new Error("Such MapField type as " + mapFieldData.type + " does not exist.");
        }
    }

    /**
     * Converts raw {@link Building | Building's} data to instance of specific
     * {@link Building}.
     * @param building Converted {@link Building | Building's} data.
     * @returns Specific subclass of {@link Building}.
     */
    instantiateBuilding(building: Building): Building {
        switch (building.type) {
            case BuildingsTypes.MAIN:
                return Object.assign(new MainBuilding(-1, -1), building);
                break;
            // Rest of types of Building to write here
            /*
            case BuildingsTypes.MINE:
                return Object.assign(new Mine(-1, -1), building);
                break;
            */
            default: throw new Error("Such Building type as " + building.type + " does not exist.");
        }
    }
}
