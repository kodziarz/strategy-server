import MapField from "../../../../strategy-common/dataClasses/MapField";
import Player from "../../../../strategy-common/dataClasses/Player";
import Unit from "../../../../strategy-common/dataClasses/Unit";
import SETTINGS from "../SETTINGS";
import Point2d from "./../../../../strategy-common/geometryClasses/Point2d";
import Map from "./Map";
export default class UnitPathVerifier {

    private map: Map;


    constructor(map: Map) {
        this.map = map;
    }


    // getCrossedMapFields = ()

    /**
     * Intersects straight line with vertical borders between {@link MapField}s.
     * @param startPoint Start point of intersected line.
     * @param endPoint End point of intersected line.
     * @returns Points of intersection with vertical borders ordered from
     * {@link startPoint} to {@link endPoint}.
     */
    private getIntersectionsWithVerticalMapBorders = (startPoint: Point2d, endPoint: Point2d): Point2d[] => {
        let directionVector = endPoint.subtract(startPoint);

        let beginningX: number;
        let endX: number;
        let iterator: number;
        let compare: (a: number, b: number) => boolean;

        if (startPoint.x < endPoint.x) {
            beginningX = Math.ceil(startPoint.x / SETTINGS.mapFieldSide) * SETTINGS.mapFieldSide;
            endX = endPoint.x;
            iterator = + SETTINGS.mapFieldSide;
            compare = this.isSmaller;
        } else if (startPoint.x > endPoint.x) {
            beginningX = Math.floor(startPoint.x / SETTINGS.mapFieldSide) * SETTINGS.mapFieldSide;
            endX = endPoint.x;
            iterator = - SETTINGS.mapFieldSide;
            compare = this.isBigger;
        } else {
            // startPoint.x == endPoint.x
            return [];
        }

        let intersectionPoints: Point2d[] = [];
        for (let x = beginningX; compare(x, endX); x += iterator) {
            let deltaX = x - beginningX;
            intersectionPoints.push(
                startPoint.copy()
                    .moveAlongVectorByX(directionVector, deltaX)
            );
        }
        return intersectionPoints;
    };


    /**
     * Intersects straight line with horizontal borders between {@link MapField}s.
     * @param startPoint Start point of intersected line.
     * @param endPoint End point of intersected line.
     * @returns Points of intersection with horizontal borders ordered from
     * {@link startPoint} to {@link endPoint}.
     */
    private getIntersectionsWithHorizontalMapBorders = (startPoint: Point2d, endPoint: Point2d): Point2d[] => {
        let directionVector = endPoint.subtract(startPoint);

        let beginningY: number;
        let endY: number;
        let iterator: number;
        let compare: (a: number, b: number) => boolean;

        if (startPoint.y < endPoint.y) {
            beginningY = Math.ceil(startPoint.y / SETTINGS.mapFieldSide) * SETTINGS.mapFieldSide;
            endY = endPoint.y;
            iterator = + SETTINGS.mapFieldSide;
            compare = this.isSmaller;
        } else if (startPoint.x > endPoint.x) {
            beginningY = Math.floor(startPoint.y / SETTINGS.mapFieldSide) * SETTINGS.mapFieldSide;
            endY = endPoint.y;
            iterator = - SETTINGS.mapFieldSide;
            compare = this.isBigger;
        } else {
            // startPoint.y == endPoint.y
            return [];
        }

        let intersectionPoints: Point2d[] = [];
        for (let y = beginningY; compare(y, endY); y += iterator) {
            let deltaY = y - beginningY;
            intersectionPoints.push(
                startPoint.copy()
                    .moveAlongVectorByY(directionVector, deltaY)
            );
        }
        return intersectionPoints;
    };

    private getCrossedMapFieldsForLine = (startPoint: Point2d, endPoint: Point2d) => {

        if (startPoint.x == endPoint.x) {
            // if line is perfectly vertical
            let horizontalIntersections = this.getIntersectionsWithHorizontalMapBorders(
                startPoint,
                endPoint
            );
            let isAscending = (endPoint.y - startPoint.y) > 0;
            let firstMapField = this.map.getMapFieldOfPosition(startPoint.x, startPoint.y);

            return this.getCrossedMapFieldsForLineByY(
                horizontalIntersections,
                isAscending,
                firstMapField
            );
        } else {
            // if line is at least partially inclined
            let verticalIntersections = this.getIntersectionsWithVerticalMapBorders(
                startPoint,
                endPoint
            );
            let horizontalIntersections = this.getIntersectionsWithHorizontalMapBorders(
                startPoint,
                endPoint
            );

            let isAscending = (endPoint.x - startPoint.x) > 0;
            let firstMapField = this.map.getMapFieldOfPosition(
                startPoint.x,
                startPoint.y
            );

            return this.getCrossedMapFieldsForLineByX(
                verticalIntersections,
                horizontalIntersections,
                isAscending,
                firstMapField
            );
        }
    };

    private getCrossedMapFieldsForLineByX = (
        verticalIntersections: Point2d[],
        horizontalIntersections: Point2d[],
        isAscending: boolean,
        firstMapField: MapField
    ) => {
        //DEV current solution of empty intersections table problem is probably nonoptimal
        let verticalIndex = verticalIntersections.length == 0 ? -1 : 0;
        let horizontalIndex = horizontalIntersections.length == 0 ? -1 : 0;
        let mapFieldsToReturn: MapField[] = [firstMapField];
        let intersectionsToReturn: Point2d[] = [];

        let lastField = firstMapField;
        let lengthsSum = verticalIntersections.length + horizontalIntersections.length;
        let shift: number;
        if (isAscending)
            shift = +1;
        else shift = -1;

        for (let i = 0; i < lengthsSum; i++) {
            //the trick with infity guarantees that point from enpty array will never be chosen
            const vertPoint = verticalIndex < 0 ? new Point2d(Infinity, 0) : verticalIntersections[verticalIndex];
            const horizPoint = horizontalIndex < 0 ? new Point2d(Infinity, 0) : horizontalIntersections[horizontalIndex];
            if (vertPoint.x < horizPoint.x) {
                verticalIndex++;
                let nextField = this.map.fields[lastField.column + shift][lastField.row];
                mapFieldsToReturn.push(nextField);
                intersectionsToReturn.push(vertPoint);
                lastField = nextField;
            } else if (vertPoint.x > horizPoint.x) {
                horizontalIndex++;
                let nextField = this.map.fields[lastField.column][lastField.row + shift];
                mapFieldsToReturn.push(nextField);
                lastField = nextField;
                intersectionsToReturn.push(horizPoint);
            }
        }
        return {
            mapFields: mapFieldsToReturn,
            intersections: intersectionsToReturn
        };
    };

    private getCrossedMapFieldsForLineByY = (
        horizontalIntersections: Point2d[],
        isAscending: boolean,
        firstMapField: MapField
    ) => {
        let mapFieldsToReturn: MapField[] = [firstMapField];

        let lastField = firstMapField;
        let shift: number;
        if (isAscending)
            shift = +1;
        else shift = -1;

        for (let i = 0; i < horizontalIntersections.length; i++) {
            let nextField = this.map.fields[lastField.column][lastField.row + shift];
            mapFieldsToReturn.push(nextField);
            lastField = nextField;
        }
        return {
            mapFields: mapFieldsToReturn,
            intersections: [...horizontalIntersections]
        };
    };

    /**
     * 
     * @param player 
     * @param startPoint 
     * @param endPoint 
     * @param unit 
     * @returns 
     * @throws !!!!
     */
    getLegalMapFieldsAndIntersectionsForLine = (
        player: Player,
        startPoint: Point2d,
        endPoint: Point2d,
        unit: Unit
    ): { mapFields: MapField[]; intersections: Point2d[]; wasPathSliced: boolean; } => {
        let { mapFields, intersections } = this.getCrossedMapFieldsForLine(startPoint, endPoint);

        for (let i = 0; i < mapFields.length; i++) {
            let mapField = mapFields[i];

            if (unit.getVelocityOnMapField(mapField) == 0) {
                // if unit cannot pass the mapfield
                if (player.observedMapFields.includes(mapField)) {
                    // if player knows, that he cannot pass the mapfield
                    throw new KnowinglyIllegalPathException();
                } else {
                    return {
                        mapFields: mapFields.slice(0, i + 1),
                        intersections: intersections.slice(0, i + 1),
                        wasPathSliced: true
                    };
                }
            }
        }
        return {
            mapFields: mapFields,
            intersections: intersections,
            wasPathSliced: false
        };
    };



    isSmaller(a: number, b: number) {
        return a < b;
    }

    isBigger(a: number, b: number) {
        return a > b;
    }
}

export class KnowinglyIllegalPathException extends Error {
    constructor() {
        super("Considered path includes MapField, which unit cannot pass and player knows about it, so the path is invalid.");
    }
}