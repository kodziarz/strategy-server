import { Logger } from "@nestjs/common";
import Building from "./../../../strategy-common/dataClasses/Building";
import MainBuilding from "./../../../strategy-common/dataClasses/buildings/MainBuilding";
import Map from "./game/Map";
import Player from "../../../strategy-common/dataClasses/Player";
import User from "./User";
import { GameGateway } from "src/game/game.gateway";
import { v4 as uuid } from "uuid";
import MapField from "../../../strategy-common/dataClasses/MapField";
import Unit from "../../../strategy-common/dataClasses/Unit";
import Builder from "../../../strategy-common/dataClasses/units/Builder";
import DataBinder from "./game/DataBinder";
import Point2d from "../../../strategy-common/geometryClasses/Point2d";
import UnitPathVerifier, { KnowinglyIllegalPathException } from "./game/UnitPathVerifier";
import Path from "./game/Path";
import TimeManager from "./game/TimeManager";
import UnitMover from "./game/UnitMover";

/**Stores data about specific game. */
export default class Game {

    private timeManager: TimeManager;
    private map: Map;
    private dataBinder: DataBinder;
    private unitPathVerifier: UnitPathVerifier;
    private unitMover: UnitMover;

    private currentPlayers: Player[] = [];
    private _isWaiting = true;

    constructor(
        private readonly gameGateway: GameGateway,
    ) {
        this.timeManager = new TimeManager();
        this.map = new Map(6, 5);
        this.dataBinder = new DataBinder(this.currentPlayers, this.map);
        this.unitPathVerifier = new UnitPathVerifier(this.map);
        this.unitMover = new UnitMover(this.timeManager);
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
        let opponentsOfOpponentPlayers = this.dataBinder.insertNewPlayer(player);
        opponentsOfOpponentPlayers.forEach(({ opponentPlayer, opponentData }) => {
            this.gameGateway.informThatOpponentJoined(
                opponentPlayer,
                opponentData
            );
        });

        let mainBuildingField = this.map.getStartMapField();
        let mainBuilding = new MainBuilding(
            mainBuildingField.centerX,
            mainBuildingField.centerY,
            player.userId
        );

        //DEV dodawanie obserwowanych pól do listy
        let newObservedMapFields = this.map.getObservableMapFieldsFromPosition(
            mainBuildingField.centerX,
            mainBuildingField.centerY
        );
        player.observedMapFields.push(...newObservedMapFields);

        this.dataBinder.insertBuilding(player, mainBuilding);
        this.informEligibleOpponentsAboutPlacedBuilding(player, mainBuilding);

        //DEV
        let testUnit = new Builder(player.userId);
        testUnit.x = mainBuildingField.centerX + 1.5 * mainBuilding.width;
        testUnit.y = mainBuildingField.centerY + 1.5 * mainBuilding.length;
        let occupiedFields = this.map.getMapFieldsOfUnit(testUnit);
        if (!occupiedFields.includes(undefined)) {
            this.dataBinder.insertUnit(player, testUnit);
            this.informEligibleOpponentsAboutPlacedUnit(player, testUnit);
        }

        this.dataBinder.addOpponentsBuildingsAndUnitsToPlayer(player, newObservedMapFields);
    };

    addBuilding = (building: Building, player: Player) => {
        //id of building should not be set by client - someone could set
        // it to value of currently existing object on purpose
        // the same with ownerId
        Object.assign(building, {
            id: uuid(),
            ownerId: player.userId
        });
        this.dataBinder.insertBuilding(player, building);

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

        let {
            newObservedBuildings,
            newObservedUnits
        } = this.dataBinder.addOpponentsBuildingsAndUnitsToPlayer(player, newObservedFields);

        this.gameGateway.informAboutMapChanges(player, newObservedFields, newObservedBuildings, newObservedUnits);
    };

    addUnit = (unit: Unit, player: Player) => {
        //id of unit should not be set by client - someone could set
        // it to value of currently existing object on purpose
        // the same with ownerId
        Object.assign(unit, {
            id: uuid(),
            ownerId: player.userId
        });
        this.dataBinder.insertUnit(player, unit);
        // player.units.push(unit);

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

    //throws KnowinglyIllegalPathException
    moveUnit = (
        player: Player,
        unit: Unit,
        pathPoints: Point2d[]
    ) => {
        let path = new Path();
        path.start = new Point2d(unit.x, unit.y);
        for (let i = 0; i < pathPoints.length - 1; i++) {
            let {
                mapFields,
                intersections,
                wasPathSliced
            } = this.unitPathVerifier.getLegalMapFieldsAndIntersectionsForLine(
                player,
                pathPoints[i],
                pathPoints[i + 1],
                unit
            );
            path.mapFields.push(...mapFields);

            if (wasPathSliced) {
                path.addIntersections(intersections.slice(0, -1));
                path.end = intersections[intersections.length - 1];
                this.unitMover.setMovement(unit, path);
                break;
            } else {
                path.addIntersections(intersections);
            }
        }
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
     * Informs eligible opponents, that given player placed building.
     * @param player Player who placed bulding.
     * @param building Placed building (already inserted into data structure).
     */
    informEligibleOpponentsAboutPlacedBuilding = (player: Player, building: Building) => {
        this.currentPlayers.forEach((updatedPlayer) => {
            if (updatedPlayer != player) {
                let opponent = updatedPlayer.getOpponentById(player.userId);
                if (opponent.buildings.find((checkedBuilding) => { return checkedBuilding == building; })) {
                    //if opponent should know about the building
                    this.gameGateway.informAboutMapChanges(updatedPlayer, null, [building], null);
                }
            }
        });
    };

    /**
     * Informs eligible opponents, that given player placed unit.
     * @param player Player who placed unit.
     * @param unit Placed unit (already inserted into data structure).
     */
    informEligibleOpponentsAboutPlacedUnit = (player: Player, unit: Unit) => {
        this.currentPlayers.forEach((updatedPlayer) => {
            if (updatedPlayer != player) {
                let opponent = updatedPlayer.getOpponentById(player.userId);
                if (opponent.units.find((checkedUnit) => { return checkedUnit == unit; })) {
                    //if opponent should know about the unit
                    this.gameGateway.informAboutMapChanges(updatedPlayer, null, null, [unit]);
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
        return this.map.fields;
    };


    public get isWaiting() {
        return this._isWaiting;
    }

}