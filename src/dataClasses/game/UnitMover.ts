import { Logger } from "@nestjs/common";
import Unit from "../../../../strategy-common/dataClasses/Unit";
import Path from "./../../../../strategy-common/geometryClasses/Path";
import TimeManager from "./TimeManager";
import { getMapFieldsOfUnit, moveUnitByDeltaTime } from "../../../../strategy-common/mapService";
import Movement from "../../../../strategy-common/geometryClasses/Movement";
import MapField from "../../../../strategy-common/dataClasses/MapField";
import { GameGateway } from "src/game/game.gateway";
import Game from "../Game";

/**
 * Moves {@link Unit}s along their {@link Path}s.
 */
export default class UnitMover {

    game: Game;
    gameGateway: GameGateway;
    movements: Movement[] = [];
    fieldsMap: MapField[][];

    constructor(game: Game, gameGateway: GameGateway, timeManager: TimeManager, fieldsMap: MapField[][]) {
        this.game = game;
        this.gameGateway = gameGateway;
        timeManager.subscribe(this.move);
        this.fieldsMap = fieldsMap;
    }

    move = (intervenedTime: number, deltaTime: number, currentUnixTime: number): void => {
        this.movements.forEach((movement, movementIndex) => {
            let remainingDeltaTime = moveUnitByDeltaTime(
                movement,
                deltaTime
            );
            movement.unit.occupiedFields.length = 0;
            movement.unit.occupiedFields.push(...getMapFieldsOfUnit(movement.unit, this.fieldsMap));

            if (remainingDeltaTime > 0) {
                Logger.debug("Jendostka dotarła do szczęśliwego końca");
                this.movements.splice(movementIndex, 1);
                this.gameGateway.informAboutMapChanges(
                    this.game.getPlayerByUserId(movement.unit.ownerId),
                    null,
                    null,
                    [movement.unit]
                );
            } else {
                Logger.debug("Jednostka kontynuuje podróż.");
                this.gameGateway.reportUnitMove(
                    this.game.getPlayerByUserId(movement.unit.ownerId),
                    {
                        movementId: movement.id,
                        position: { x: movement.unit.x, y: movement.unit.y },
                        lastPointIndex: movement.nextPointIndex,
                        timestamp: movement.lastTimestamp
                    }
                );
            }
        });
    };

    setMovement = (movementId: string, unit: Unit, path: Path) => {
        let start = Date.now();
        let movement = new Movement();
        movement.id = movementId;
        movement.nextPointIndex = 0;
        movement.lastTimestamp = Date.now();
        movement.path = path;
        movement.start = start;
        movement.unit = unit;
        this.movements.push(movement);
        return movement;
    };
}