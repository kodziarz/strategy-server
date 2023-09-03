import MapField from "../../../../strategy-common/dataClasses/MapField";
import Player from "../../../../strategy-common/dataClasses/Player";
import Unit from "../../../../strategy-common/dataClasses/Unit";
import Point2d from "./../../../../strategy-common/geometryClasses/Point2d";
import Map from "./Map";
import { getCrossedMapFieldsForLine, getMapFieldOfPoint } from "./../../../../strategy-common/mapService";
export default class UnitPathVerifier {

    private map: Map;


    constructor(map: Map) {
        this.map = map;
    }

    /**
     * Gets path data for line. For 2 given points finds all legal crossings between 
     * {@link MapField}s and {@link MapField}s themselves, which are located on
     * the way between points.
     * @param player Player, whoose unit is moved.
     * @param startPoint Start point of the line.
     * @param endPoint End point of the line.
     * @param unit Unit to move.
     * @returns Object containing list of {@link MapField}s and crossings of line
     * between the {@link MapField}s. If there is a {@link MapField}, on which
     * the unit has velocity equal to 0 and does not belong to {@link player}'s
     * observed {@link MapFields}, then lists are cut. The {@link MapField}s
     * array ends with field previous to the non-crossable and crossings array
     * ands with the crossing to the non-crossable {@link MapField}.
     * @throws The {@link KnowinglyIllegalPathException} if observed by player
     * {@link MapField}, on which the {@link unit} has velocity 0 (cannot cross
     * it), is found on the way of the line.
     */
    getLegalMapFieldsAndIntersectionsForLine = (
        player: Player,
        startPoint: Point2d,
        endPoint: Point2d,
        unit: Unit
    ): { mapFields: MapField[]; crossings: Point2d[]; wasPathSliced: boolean; } => {
        let { mapPositions, crossings } = getCrossedMapFieldsForLine(startPoint, endPoint);
        let mapFields = mapPositions.map((position) => { return this.map.fields[position.column][position.row]; });

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
                        crossings: crossings.slice(0, i + 1),
                        wasPathSliced: true
                    };
                }
            }
        }
        return {
            mapFields: mapFields,
            crossings: crossings,
            wasPathSliced: false
        };
    };
}

export class KnowinglyIllegalPathException extends Error {
    constructor() {
        super("Considered path includes MapField, which unit cannot pass and player knows about it, so the path is invalid.");
    }
}