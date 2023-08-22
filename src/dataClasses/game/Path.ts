import MapField from "../../../../strategy-common/dataClasses/MapField";
import Point2d from "../../../../strategy-common/geometryClasses/Point2d";

export default class Path {

    mapFields: MapField[];
    points: Point2d[];

    constructor(
        mapFields: MapField[],
        points: Point2d[]
    );
    constructor();

    constructor(
        mapFields?: MapField[],
        points?: Point2d[]
    ) {
        if (points != undefined) {
            // if the first constructor is used
            if (points.length != mapFields.length + 1) {
                throw new Error("Path points number needs to be bigger than map fields number by one.");
            }
            this.mapFields = mapFields;
            this.points = points;
        } else {
            // if the second constructor is used
            this.mapFields = [];
            this.points = [];
        }
    }
}