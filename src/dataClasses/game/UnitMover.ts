import { Logger } from "@nestjs/common";
import Unit from "../../../../strategy-common/dataClasses/Unit";
import Path from "./../../../../strategy-common/geometryClasses/Path";
import TimeManager from "./TimeManager";
import { getMapFieldsOfUnit, moveUnitByDeltaTime } from "../../../../strategy-common/mapService";
import Movement from "../../../../strategy-common/geometryClasses/Movement";
import MapField from "../../../../strategy-common/dataClasses/MapField";
import { GameGateway } from "src/game/game.gateway";
import Game from "../Game";
import ReportUnitMoveMessage from "../../../../strategy-common/socketioMessagesClasses/ReportUnitMoveMessage";
import VisibilityManager from "./VisibilityManager";
import DataBinder from "./DataBinder";

/**
 * Moves {@link Unit}s along their {@link Path}s.
 */
export default class UnitMover {

    game: Game;
    visibilityManager: VisibilityManager;
    dataBinder: DataBinder;
    gameGateway: GameGateway;
    movements: Movement[] = [];
    fieldsMap: MapField[][];

    constructor(
        game: Game,
        visibilityManager: VisibilityManager,
        dataBinder: DataBinder,
        gameGateway: GameGateway,
        timeManager: TimeManager,
        fieldsMap: MapField[][]
    ) {
        this.game = game;
        this.visibilityManager = visibilityManager;
        this.dataBinder = dataBinder;
        this.gameGateway = gameGateway;
        timeManager.subscribe((elapsedTime, deltaTime, currentUnixTime) => { this.moveUnits(deltaTime, currentUnixTime); });
        this.fieldsMap = fieldsMap;
    }

    /**
     * Moves units.
     * @param deltaTime Time elapsed from last invocation of the method.
     */
    moveUnits = (deltaTime: number, currentUnixTime: number): void => {
        this.movements.forEach((movement, movementIndex) => {
            this.moveUnit(movement, movementIndex, deltaTime, currentUnixTime);
        });
    };

    /**
     * Moves Unit.
     * @param movement Movement data.
     * @param movementIndex Index of movement in {@link movements} array.
     * @param deltaTime Time elapsed from last invocation of the method.
     */
    private moveUnit = (movement: Movement, movementIndex: number, deltaTime: number, currentUnixTime: number) => {
        let remainingDeltaTime = moveUnitByDeltaTime(
            movement,
            deltaTime,
            currentUnixTime
        );
        movement.unit.occupiedFields.length = 0;
        movement.unit.occupiedFields.push(...getMapFieldsOfUnit(movement.unit, this.fieldsMap));

        if (remainingDeltaTime > 0) {
            Logger.debug("Jendostka dotarła do szczęśliwego końca");
            this.movements.splice(movementIndex, 1);

            let player = this.game.getPlayerByUserId(movement.unit.ownerId);
            this.gameGateway.informAboutMapChanges(
                player,
                null,
                null,
                [movement.unit]
            );
            this.game.informEligibleOpponentsAboutUnit(
                player,
                movement.unit
            );
            this.game.updateMapInformation(player, movement.unit.x, movement.unit.y);
        } else {
            // Logger.debug("Jednostka kontynuuje podróż.");
            let player = this.game.getPlayerByUserId(movement.unit.ownerId);
            this.gameGateway.reportUnitMove(
                player,
                {
                    movementId: movement.id,
                    position: { x: movement.unit.x, y: movement.unit.y },
                    nextPointIndex: movement.nextPointIndex,
                    timestamp: movement.lastTimestamp
                } as ReportUnitMoveMessage
            );
            this.game.informEligibleOpponentsAboutUnit(
                player,
                movement.unit
            );
            this.game.updateMapInformation(player, movement.unit.x, movement.unit.y);
            this.updateMapInfo(movement);
        }
    };

    updateMapInfo = (movement: Movement) => {
        let unit = movement.unit;
        let player = this.game.getPlayerByUserId(unit.ownerId);



        let newMapFields = this.visibilityManager.getNewObservedMapFieldsFromPosition(unit.x, unit.y, player);
        player.observedMapFields.push(...newMapFields);

        let { newObservedBuildings, newObservedUnits } = this.dataBinder.addOpponentsBuildingsAndUnitsToPlayer(player, newMapFields);

    };

    /**
     * Moves unit by given time and removes its movement from list (stops it).
     * @param unit Moving unit.
     * @param currentTimestamp Unix time of the moment, to which the movement
     * needs to be performed.
     */
    finishMovementOfUnit = (unit: Unit, currentTimestamp: number) => {
        let ongoingMovement: Movement = null;
        let ongoingMovementIndex: number;
        for (let i = 0; i < this.movements.length; i++) {
            const checkedMovement = this.movements[i];
            if (checkedMovement.unit.id == unit.id) {
                ongoingMovement = checkedMovement;
                ongoingMovementIndex = i;
                break;
            }
        }
        if (ongoingMovement) {
            this.moveUnit(
                ongoingMovement,
                ongoingMovementIndex,
                (currentTimestamp - ongoingMovement.lastTimestamp) / 1000,
                currentTimestamp
            );
            //the movement could end after this operation, so it needs to be verified
            if (this.movements[ongoingMovementIndex] == ongoingMovement)
                this.movements.splice(ongoingMovementIndex, 1);
        }
    };

    /**
     * Starts movement by given parameters.
     * @param movementId Id of set movement.
     * @param unit Moved unit.
     * @param path Path of the movement.
     * @param start Unix time of start.
     */
    setMovement = (movementId: string, unit: Unit, path: Path, start: number) => {

        let movement = new Movement();
        movement.id = movementId;
        movement.nextPointIndex = 0;
        movement.lastTimestamp = start;
        movement.path = path;
        movement.start = start;
        movement.unit = unit;
        this.movements.push(movement);
        return movement;
    };
}