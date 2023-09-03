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
import TimeManager from "./game/TimeManager";
import UnitMover from "./game/UnitMover";
import Path from "../../../strategy-common/geometryClasses/Path";
import { getMapFieldsOfUnit } from "../../../strategy-common/mapService";
import VisibilityManager from "./game/VisibilityManager";

/**Stores data about specific game. */
export default class Game {

    private timeManager: TimeManager;
    private map: Map;
    private visibilityManager: VisibilityManager;
    private dataBinder: DataBinder;
    private unitPathVerifier: UnitPathVerifier;
    private unitMover: UnitMover;

    private currentPlayers: Player[] = [];
    private _isWaiting = true;

    constructor(
        private readonly gameGateway: GameGateway,
    ) {
        this.timeManager = new TimeManager();
        this.map = new Map(10, 20);
        this.visibilityManager = new VisibilityManager(this.map);
        this.dataBinder = new DataBinder(this.currentPlayers, this.map);
        this.unitPathVerifier = new UnitPathVerifier(this.map);
        this.unitMover = new UnitMover(this, this.visibilityManager, this.dataBinder, gameGateway, this.timeManager, this.map.fields);
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
        let occupiedFields = getMapFieldsOfUnit(testUnit, this.map.fields);
        if (!occupiedFields.includes(undefined)) {
            this.dataBinder.insertUnit(player, testUnit);
            this.informEligibleOpponentsAboutUnit(player, testUnit);
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

        this.updateMapInformation(player, building.x, building.y);
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
        this.informEligibleOpponentsAboutUnit(player, unit);

        this.updateMapInformation(player, unit.x, unit.y);
    };

    /**
     * Updates Map information when getting new point of view by player.
     * @param player Player who changes point of view.
     * @param x X coordinate of point of view.
     * @param y Y coordinate of point of view.
     */
    updateMapInformation = (player: Player, x: number, y: number) => {
        // get new observed mapFields, to send them to client
        let newObservedFields = this.visibilityManager.getNewObservedMapFieldsFromPosition(
            x,
            y,
            player
        );
        // add them to players' list
        player.observedMapFields.push(...newObservedFields);

        let { newObservedBuildings, newObservedUnits } = this.dataBinder.addOpponentsBuildingsAndUnitsToPlayer(player, newObservedFields);

        this.gameGateway.informAboutMapChanges(player, newObservedFields, newObservedBuildings, newObservedUnits);
    };

    //throws KnowinglyIllegalPathException
    moveUnit = (
        movementId: string,
        player: Player,
        unit: Unit,
        pathPoints: Point2d[]
    ) => {
        try {
            Logger.debug("pathPoints: ");
            Logger.debug(pathPoints);
            let path = new Path();

            let start = Date.now();
            this.unitMover.finishMovementOfUnit(unit, start);

            let lineEnd = new Point2d(unit.x, unit.y);
            for (let i = 0; i < pathPoints.length; i++) {
                let lineStart = lineEnd;
                lineEnd = pathPoints[i];

                let {
                    mapFields,
                    crossings,
                    wasPathSliced
                } = this.unitPathVerifier.getLegalMapFieldsAndIntersectionsForLine(
                    player,
                    lineStart,
                    lineEnd,
                    unit
                );
                path.mapFields.push(...mapFields);
                path.points.push(...crossings);

                if (wasPathSliced) {
                    // if path is sliced, it ends with an intersection, so the end does not need to be added.
                    let movement = this.unitMover.setMovement(movementId, unit, path, start);
                    this.gameGateway.confirmUnitMove(player, movement.id, movement.start);
                    return;
                } else {
                    // end of processed line is not an intersection, so it needs to be added
                    path.points.push(lineEnd);
                }
            }
            let movement = this.unitMover.setMovement(movementId, unit, path, start);
            Logger.debug("Ustawiam ruch według danych: ");
            let copy = { ...movement };
            copy.unit = copy.unit.getWithIdentifiers() as Unit; // only dev bro, don't care
            copy.path = copy.path.getWithIdentifiers() as Path;
            Logger.debug(copy);

            this.gameGateway.confirmUnitMove(player, movement.id, movement.start);
        } catch (ex: any) {
            if (ex instanceof KnowinglyIllegalPathException) {
                this.gameGateway.rejectUnitMove(player, movementId);
            } else throw ex;
        }
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
     * Informs eligible opponents, that given player moved or placed unit.
     * @param player Player who placed unit.
     * @param unit Modified unit (already inserted into data structure).
     */
    informEligibleOpponentsAboutUnit = (player: Player, unit: Unit) => {
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