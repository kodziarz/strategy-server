import { Logger } from "@nestjs/common";
import Building from "./../../../strategy-common/dataClasses/Building";
import MainBuilding from "./../../../strategy-common/dataClasses/buildings/MainBuilding";
import Map from "./game/Map";
import Opponent from "./../../../strategy-common/dataClasses/Opponent";
import Player from "../../../strategy-common/dataClasses/Player";
import User from "./User";
import { GameGateway } from "src/game/game.gateway";
import { v4 as uuid } from "uuid";
import MapField from "../../../strategy-common/dataClasses/MapField";

/**Stores data about specific game. */
export default class Game {

    private map: Map;
    private currentPlayers: Player[] = [];
    private buildings: Building[] = [];
    private _isWaiting = true;

    constructor(
        private readonly gameGateway: GameGateway
    ) {
        this.map = new Map(50, 100);
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
            // adds another player as opponent to the player
            let alreadyExistingOpponentData = new Opponent(opponentPlayer.userId);
            player.opponents.push(alreadyExistingOpponentData);

            // add player as an opponent to other players
            let addedPlayerOpponentData = new Opponent(player.userId);
            opponentPlayer.opponents.push(addedPlayerOpponentData);
            this.gameGateway.informThatOpponentJoined(opponentPlayer, addedPlayerOpponentData);
        });

        this.currentPlayers.push(player);

        let mainBuildingField = this.map.getStartMapField();
        let mainBuilding = new MainBuilding(
            mainBuildingField.centerX,
            mainBuildingField.centerY
        );
        // player.buildings.push(mainBuilding);
        this.insertBuildingToDataStructure(player, mainBuilding);
        this.informEligibleOpponentsAboutPlacedBuilding(player, mainBuilding);

        //DEV dodawanie obserwowanych pól do listy
        player.observedMapFields.push(
            ...this.map.getObservableMapFieldsFromPosition(
                mainBuildingField.centerX,
                mainBuildingField.centerY
            ));

        // adding oppontents' buildings to players' data about opponents.
        this.currentPlayers.forEach((checkedPlayer) => {
            if (checkedPlayer != player) {
                checkedPlayer.buildings.forEach((checkedPlayersBuilding) => {
                    checkedPlayersBuilding.occupiedFields.forEach((occupiedMapfield) => {
                        if (player.observedMapFields.includes(occupiedMapfield))
                            player.getOpponentById(checkedPlayer.userId).buildings.push(checkedPlayersBuilding);
                    });
                });
            }
        });
    };

    addBuilding = (building: Building, player: Player) => {
        //id of building should not be set by client - someone could set
        // it to value of currently existing object on purpose
        Object.assign(building, { id: uuid() });
        // player.buildings.push(building);
        this.insertBuildingToDataStructure(player, building);

        // inform about building
        this.gameGateway.confirmBuildingPlaced(player, building);
        // let changedMapFileds = this.map.getMapFieldsOfBuilding(building);
        // changedMapFileds.forEach((changedMapField) => { changedMapField.buildings.push(building); });
        this.informEligibleOpponentsAboutPlacedBuilding(player, building);

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

    /**
     * Inserts building into all necessary data structures. Does not send this
     * data to clients.
     * Data is insterted into: player.building, fields in this.map, opponentPlayers.opponent.buildings
     * @param player Owner of the placed building.
     * @param building Placed building.
     */
    insertBuildingToDataStructure = (player: Player, building: Building) => {
        player.buildings.push(building);

        let changedMapFields = this.map.getMapFieldsOfBuilding(building);
        changedMapFields.forEach((changedMapFiled) => {
            changedMapFiled.buildings.push(building);
        });

        this.currentPlayers.forEach((updatedPlayer) => {
            if (updatedPlayer != player) {
                let opponent = updatedPlayer.getOpponentById(player.userId);
                opponent.buildings.push(building);
            }
        });

        // building.occupiedFields.push(...changedMapFields);
        changedMapFields.forEach((mapField) => { building.occupiedFields.push(mapField); });
    };

    /**
     * Informs eligible opponents, that given player placed building.
     * @param player Player who placed bulding.
     * @param building Placed building.
     */
    informEligibleOpponentsAboutPlacedBuilding = (player: Player, building: Building) => {
        let changedMapFileds = this.map.getMapFieldsOfBuilding(building);
        this.currentPlayers.forEach((checkedPlayer) => {
            if (checkedPlayer != player) {
                let playersChangedFields: MapField[] = [];
                for (const field of changedMapFileds) {
                    if (checkedPlayer.observedMapFields.includes(field))
                        playersChangedFields.push(field);
                }
                if (playersChangedFields.length > 0) { // is eligible
                    let opponent = checkedPlayer.getOpponentById(player.userId);
                    opponent.buildings.push(building);
                    this.gameGateway.informAboutOpponentChangedBuildings(checkedPlayer, player, [building]);
                }
            }
        });
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

    getMapFields = () => {
        return this.map.mapFields;
    };


    public get isWaiting() {
        return this._isWaiting;
    }

}