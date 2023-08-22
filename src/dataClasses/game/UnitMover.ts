import { Logger } from "@nestjs/common";
import Unit from "../../../../strategy-common/dataClasses/Unit";
import Vector2d from "../../../../strategy-common/geometryClasses/Vector2d";
import Path from "./Path";
import TimeManager from "./TimeManager";
import Point2d from "../../../../strategy-common/geometryClasses/Point2d";

/**
 * Moves {@link Unit}s along their {@link Path}s.
 */
export default class UnitMover {

    movements: Movement[] = [];

    constructor(timeManager: TimeManager) {
        timeManager.subscribe(this.move);
    }

    move = (intervenedTime: number, deltaTime: number, currentUnixTime: number): void => {
        this.movements.forEach((movement, movementIndex) => {
            let lastPoint = movement.path.points[movement.lastPointIndex];
            let nextPoint = movement.path.points[movement.lastPointIndex + 1];

            let v = new Vector2d(
                nextPoint.x - lastPoint.x,
                nextPoint.y - lastPoint.y
            );
            let distance = Math.sqrt(v.x * v.x + v.y * v.y);

            let sToReachNext = distance - movement.distanceFromLastIntersection;
            let vOnMapField = movement.unit.getVelocityOnMapField(movement.path.mapFields[movement.lastMapFieldIndex]);
            let tToReachNext = sToReachNext / vOnMapField;

            if (tToReachNext > deltaTime) {
                // if next point is not reached this time
                movement.distanceFromLastIntersection += vOnMapField * deltaTime;
                this.setUnitPositionByDistanceBetweenPoints(
                    movement.unit,
                    lastPoint,
                    nextPoint,
                    movement.distanceFromLastIntersection
                );
                Logger.debug("Jendostka kontynuuje podróż:");
                //TODO move unit, inform user about moving his unit and so on.
            } else {
                // if next point is crossed
                let remainingTime = deltaTime - tToReachNext;

                do {
                    movement.lastPointIndex++;
                    movement.lastMapFieldIndex++;
                    if (movement.lastPointIndex == movement.path.points.length - 1) {
                        this.finishUnitsJourney(movementIndex);
                        return;
                    }

                    lastPoint = nextPoint;
                    nextPoint = movement.path.points[movement.lastPointIndex + 1];

                    let v = new Vector2d(
                        nextPoint.x - lastPoint.x,
                        nextPoint.y - lastPoint.y
                    );

                    let sToReachNext = Math.sqrt(v.x * v.x + v.y * v.y);
                    let vOnMapField = movement.unit.getVelocityOnMapField(movement.path.mapFields[movement.lastMapFieldIndex]);
                    let tToReachNext = sToReachNext / vOnMapField;
                    remainingTime -= tToReachNext;

                    if (remainingTime > 0) {
                        if (movement.lastPointIndex == movement.path.points.length - 2) {
                            this.finishUnitsJourney(movementIndex);
                            return;
                        }
                        // else continue executing loop
                    } else {
                        // if remainingTime < 0
                        let lackingDistance = -remainingTime * vOnMapField; //remaningTime is negative
                        movement.distanceFromLastIntersection = sToReachNext - lackingDistance;
                        this.setUnitPositionByDistanceBetweenPoints(
                            movement.unit,
                            lastPoint,
                            nextPoint,
                            movement.distanceFromLastIntersection
                        );
                        Logger.debug("Jendostka kontynuuje podróż:");
                        //TODO inform user about moving his unit and so on.
                    }

                } while (remainingTime > 0);
            }
        });
    };

    finishUnitsJourney = (movementIndex: number) => {
        //reached the end of the path -> finish journey.
        //TODO finish journey of unit, inform user about it and so on
        Logger.debug("Jendostka dotarła do szczęśliwego końca");
        this.movements.splice(movementIndex, 1);

    };

    private setUnitPositionByDistanceBetweenPoints = (
        unit: Unit,
        start: Point2d,
        end: Point2d,
        distance: number
    ) => {
        let v = end.subtract(start);
        let unitPosition = start.copy().moveAlongVectorByLength(v, distance);
        unit.x = unitPosition.x;
        unit.y = unitPosition.y;
    };

    setMovement = (unit: Unit, path: Path) => {
        let start = Date.now();
        this.movements.push(
            {
                unit,
                path,
                start: start,
                lastPointIndex: 0,
                lastMapFieldIndex: 0,
                distanceFromLastIntersection: 0
            }
        );
        return start;
    };
}

interface Movement {
    unit: Unit;
    path: Path;
    /** Unix time date of start.*/
    start: number;
    lastPointIndex: number;
    lastMapFieldIndex: number;
    distanceFromLastIntersection: number;
}