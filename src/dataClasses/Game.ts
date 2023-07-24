import { Logger } from "@nestjs/common";
import Building from "./../../../strategy-common/dataClasses/Building";
import MainBuilding from "./../../../strategy-common/dataClasses/buildings/MainBuilding";
import Map from "./game/Map";
import Opponent from "./../../../strategy-common/dataClasses/Opponent";
import Player from "../../../strategy-common/dataClasses/Player";
import User from "./User";
import { GameGateway } from "src/game/game.gateway";
import { v4 as uuid } from "uuid";

/**Stores data about specific game. */
export default class Game {

    private map: Map;
    private currentPlayers: Player[] = [];
    private buildings: Building[] = [];
    private _isWaiting = true;
    // private readonly onObservedMapFieldChanged: (player: Player, changedFields: MapField[]) => void;
    // private readonly onBuildingChanged: (player: Player, changedBuildings: Building[]) => void;

    constructor(
        private readonly gameGateway: GameGateway
    ) {
        this.map = new Map(20, 40);
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

    /**Adds {@link User} to the game ({@link Game}) */
    addPlayer = (user: User) => {

        //init players data
        let player = new Player(
            user.id,
            this.getColumns(),
            this.getRows()
        );
        this.currentPlayers.forEach((opponentPlayer) => {
            player.opponents.push(new Opponent(opponentPlayer.userId));
            // add player as an opponent to other players
            opponentPlayer.opponents.push(new Opponent(player.userId));
        });

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

    addBuilding = (building: Building, player: Player) => {
        Object.assign(building, { id: uuid() });
        //id of building should not be set by client - someone could set
        // it to value of currently existing object on purpose
        player.buildings.push(building);

        // inform eligible players about change
        let changedMapFileds = this.map.getMapFieldsOfBuilding(building);
        this.currentPlayers.forEach((checkedPlayer) => {
            if (checkedPlayer == player) {
                this.gameGateway.confirmBuildingPlaced(player, building);
            } else { // opponent may be eligible to know what happened
                let playersChangedFields = [];
                for (const field of changedMapFileds) {
                    if (checkedPlayer.observedMapFields.includes(field))
                        playersChangedFields.push(field);
                }
                if (playersChangedFields.length > 0) { // is eligible
                    let opponent = checkedPlayer.getOpponentById(player.userId);
                    opponent.buildings.push(building);
                    this.gameGateway.informAboutChangedBuildings(checkedPlayer, playersChangedFields);
                }
            }
        });

        // get new observed mapFields, to send them to client
        let observedFields = this.map.getObservableMapFieldsFromPosition(
            building.x,
            building.y
        );
        let newObservedFields = [];
        for (let i = 0; i < observedFields.length; i++) {
            const observedField = observedFields[i];
            if (player.observedMapFields.every((alreadyObsevedField) => {
                return alreadyObsevedField != observedField;
            }))
                newObservedFields.push(observedField);
        }

        // add them to players' list
        player.observedMapFields.push(...newObservedFields);
        this.gameGateway.informAboutChangedMapFields(player, newObservedFields);
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