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
import Unit from "../../../strategy-common/dataClasses/Unit";
import Builder from "../../../strategy-common/dataClasses/units/Builder";

/**Stores data about specific game. */
export default class Game {

    private map: Map;
    private currentPlayers: Player[] = [];
    private buildings: Building[] = [];
    private _isWaiting = true;

    constructor(
        private readonly gameGateway: GameGateway
    ) {
        this.map = new Map(10, 20);
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
            mainBuildingField.centerY,
            player.userId
        );
        this.insertBuildingToDataStructure(player, mainBuilding);
        this.informEligibleOpponentsAboutPlacedBuilding(player, mainBuilding);

        //DEV
        let testUnit = new Builder(player.userId);
        testUnit.x = mainBuildingField.centerX + 2 * mainBuilding.width;
        testUnit.y = mainBuildingField.centerY + 2 * mainBuilding.length;
        let occupiedFields = this.map.getMapFieldsOfUnit(testUnit);
        if (!occupiedFields.includes(undefined)) {
            this.insertUnitToDataStructure(player, testUnit);
            this.informEligibleOpponentsAboutPlacedUnit(player, testUnit);
        }

        //DEV dodawanie obserwowanych pól do listy
        player.observedMapFields.push(
            ...this.map.getObservableMapFieldsFromPosition(
                mainBuildingField.centerX,
                mainBuildingField.centerY
            ));

        // adding oppontents' buildings and units to players' data about opponents.
        this.currentPlayers.forEach((checkedPlayer) => {
            if (checkedPlayer != player) {
                checkedPlayer.buildings.forEach((checkedPlayersBuilding) => {
                    checkedPlayersBuilding.occupiedFields.forEach((occupiedMapfield) => {
                        if (player.observedMapFields.includes(occupiedMapfield))
                            player.getOpponentById(checkedPlayer.userId).buildings.push(checkedPlayersBuilding);
                    });
                });
                checkedPlayer.units.forEach((checkedPlayersUnit) => {
                    checkedPlayersUnit.occupiedFields.forEach((occupiedMapfield) => {
                        if (player.observedMapFields.includes(occupiedMapfield))
                            player.getOpponentById(checkedPlayer.userId).units.push(checkedPlayersUnit);
                    });
                });
            }
        });
    };

    addBuilding = (building: Building, player: Player) => {
        //id of building should not be set by client - someone could set
        // it to value of currently existing object on purpose
        // the same with ownerId
        Object.assign(building, {
            id: uuid(),
            ownerId: player.userId
        });
        this.insertBuildingToDataStructure(player, building);

        // inform about building
        this.gameGateway.confirmBuildingPlaced(player, building);
        this.informEligibleOpponentsAboutPlacedBuilding(player, building);

        // get new observed mapFields, to send them to client
        let newObservedFields = this.getNewObservedMapFieldsFromPosition(
            building.x,
            building.y,
            player
        );

        // add them to players' list
        player.observedMapFields.push(...newObservedFields);

        let discoveredBuildings = this.getNewBuildingsFromNewObservedFields(newObservedFields);
        let discoveredUnits = this.getNewUnitsFromNewObservedFields(newObservedFields);

        this.gameGateway.informAboutMapChanges(player, newObservedFields, discoveredBuildings, discoveredUnits);
    };

    addUnit = (unit: Unit, player: Player) => {
        //id of unit should not be set by client - someone could set
        // it to value of currently existing object on purpose
        // the same with ownerId
        Object.assign(unit, {
            id: uuid(),
            ownerId: player.userId
        });
        this.insertUnitToDataStructure(player, unit);
        player.units.push(unit);

        // inform about building
        this.gameGateway.confirmUnitCreated(player, unit);
        this.informEligibleOpponentsAboutPlacedUnit(player, unit);

        // get new observed mapFields, to send them to client
        let newObservedFields = this.getNewObservedMapFieldsFromPosition(
            unit.x,
            unit.y,
            player
        );
        // add them to players' list
        player.observedMapFields.push(...newObservedFields);

        let discoveredBuildings = this.getNewBuildingsFromNewObservedFields(newObservedFields);
        let discoveredUnits = this.getNewUnitsFromNewObservedFields(newObservedFields);

        this.gameGateway.informAboutMapChanges(player, newObservedFields, discoveredBuildings, discoveredUnits);
    };

    getNewObservedMapFieldsFromPosition = (x: number, y: number, player: Player) => {
        let observedFields = this.map.getObservableMapFieldsFromPosition(x, y);
        let newObservedFields: MapField[] = [];
        for (let i = 0; i < observedFields.length; i++) {
            const observedField = observedFields[i];
            if (!player.observedMapFields.find((alreadyObsevedField) => {
                return alreadyObsevedField == observedField;
            }))
                newObservedFields.push(observedField);
        }
        return newObservedFields;
    };

    getNewBuildingsFromNewObservedFields = (newObservedFields: MapField[]) => {
        let discoveredBuildings = new Set<Building>();
        newObservedFields.forEach((newObservedField) => {
            //every building on discovered mapFields is new (even if was noticed
            //before - then client stores the old state of it.)
            newObservedField.buildings.forEach((building) => {
                discoveredBuildings.add(building);
            });
        });
        return Array.from(discoveredBuildings);
    };

    getNewUnitsFromNewObservedFields = (newObservedFields: MapField[]) => {
        let discoveredUnits = new Set<Unit>();
        newObservedFields.forEach((newObservedField) => {
            //every unit on discovered mapFields is new (even if was noticed
            //before - then client stores the old state of it.)
            newObservedField.units.forEach((unit) => {
                discoveredUnits.add(unit);
            });
        });
        return Array.from(discoveredUnits);
    };

    /**
     * Inserts building into all necessary data structures. Does not send this
     * data to clients.
     * Data is insterted into: player.buildings, fields in this.map, opponentPlayers.opponent.buildings
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
                let isObserved = false;
                for (let changedMapField of changedMapFields) {
                    if (updatedPlayer.observedMapFields.includes(changedMapField)) {
                        isObserved = true;
                        break;
                    }
                }
                if (isObserved) {
                    let opponent = updatedPlayer.getOpponentById(player.userId);
                    opponent.buildings.push(building);
                }
            }
        });

        building.occupiedFields.push(...changedMapFields);
    };

    /**
     * Inserts {@link Unit} into all necessary data structures. Does not send this
     * data to clients.
     * Data is insterted into: player.units, fields in this.map, opponentPlayers.opponent.units
     * @param player Owner of the placed unit.
     * @param unit Placed unit.
     */
    insertUnitToDataStructure = (player: Player, unit: Unit) => {
        player.units.push(unit);

        let changedMapFields = this.map.getMapFieldsOfUnit(unit);
        changedMapFields.forEach((changedMapFiled) => {
            changedMapFiled.units.push(unit);
        });

        this.currentPlayers.forEach((updatedPlayer) => {
            if (updatedPlayer != player) {
                let isUnitObserved = false;
                for (let changedMapField of changedMapFields) {
                    if (updatedPlayer.observedMapFields.includes(changedMapField)) {
                        isUnitObserved = true;
                        break;
                    }
                }
                if (isUnitObserved) {
                    let opponent = updatedPlayer.getOpponentById(player.userId);
                    opponent.units.push(unit);
                }
            }
        });

        unit.occupiedFields.push(...changedMapFields);
    };

    /**
     * Informs eligible opponents, that given player placed building.
     * @param player Player who placed bulding.
     * @param building Placed building.
     */
    informEligibleOpponentsAboutPlacedBuilding = (player: Player, building: Building) => {
        let changedMapFields = building.occupiedFields;
        this.currentPlayers.forEach((checkedPlayer) => {
            if (checkedPlayer != player) {
                let playersChangedFields: MapField[] = [];
                for (const field of changedMapFields) {
                    if (checkedPlayer.observedMapFields.includes(field))
                        playersChangedFields.push(field);
                }
                if (playersChangedFields.length > 0) { // is eligible
                    let opponent = checkedPlayer.getOpponentById(player.userId);
                    opponent.buildings.push(building);
                    this.gameGateway.informAboutMapChanges(checkedPlayer, null, [building], null);
                }
            }
        });
    };

    /**
     * Informs eligible opponents, that given player placed unit.
     * @param player Player who placed unit.
     * @param unit Placed unit.
     */
    informEligibleOpponentsAboutPlacedUnit = (player: Player, unit: Unit) => {
        let changedMapFields = unit.occupiedFields;
        this.currentPlayers.forEach((checkedPlayer) => {
            if (checkedPlayer != player) {
                let playersChangedFields: MapField[] = [];
                for (const field of changedMapFields) {
                    if (checkedPlayer.observedMapFields.includes(field))
                        playersChangedFields.push(field);
                }
                if (playersChangedFields.length > 0) { // is eligible
                    let opponent = checkedPlayer.getOpponentById(player.userId);
                    opponent.units.push(unit);
                    this.gameGateway.informAboutMapChanges(checkedPlayer, null, null, [unit]);
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