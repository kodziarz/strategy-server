import { Logger } from "@nestjs/common";
import Building from "./game/Building";
import MainBuilding from "./game/buildings/MainBuilding";
import Map from "./game/Map";
import Player from "./Player";
import User from "./User";

/**Stores data about specific game. */
export default class Game {

    private map: Map;
    private currentPlayers: Player[] = [];
    private buildings: Building[] = [];
    private _isWaiting = true;

    constructor() {
        this.map = new Map(20, 20);
    }

    /**
     * Determines whether user pariticipates in the game.
     * @param userId {@link User | User's} id. 
     */
    isPlayerActive = (userId: number) => {
        for (let i = 0; i < this.currentPlayers.length; i++) {
            const player = this.currentPlayers[i];
            if (player.userId == userId)
                return true;
        }
        return false;
    };

    /**Adds {@link User} to current game ({@link Game}) */
    addPlayer = (user: User) => {
        let player = new Player(user);
        this.currentPlayers.push(player);

        let mainBuildingField = this.map.getStartMapField();
        let mainBuilding = new MainBuilding(
            mainBuildingField.x,
            mainBuildingField.y
        );
        player.buildings.push(mainBuilding);

        //DEV dodawanie obserwowanych pól do listy
        player.observedMapFields.push(
            ...this.map.getObservableMapFieldsFromPosition(
                mainBuildingField.x,
                mainBuildingField.y
            ));
    };

    getPlayerByUserId = (userId: number) => {
        for (const player of this.currentPlayers) {
            if (player.userId == userId) return player;
        }
        return null;
    };

    getRows = () => {
        return this.map.rows;
    };

    getColumns = () => {
        return this.map.columns;
    };


    public get isWaiting() {
        return this._isWaiting;
    }

}