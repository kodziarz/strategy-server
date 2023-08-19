import MapField from "../../../../strategy-common/dataClasses/MapField";
import Point2d from "../../../../strategy-common/geometryClasses/Point2d";

export default class Path {

    start: Point2d;
    end: Point2d;
    private intersections: Point2d[];
    mapFields: MapField[];
    points: Point2d[] = [];

    constructor(
        start: Point2d,
        end: Point2d,
        intersections: Point2d[],
        mapFields: MapField[]
    );
    constructor();

    constructor(
        start?: Point2d,
        end?: Point2d,
        intersections?: Point2d[],
        mapFields?: MapField[]
    ) {
        if (start != undefined) {
            // if the first constructor is used
            if (intersections.length != mapFields.length - 1) {
                throw new Error("Path intersection points number needs to be smaller than map fields number by one.");
            }
            this.start = start;
            this.end = end;
            this.intersections;
            this.mapFields = mapFields;
            this.points = [start, ...intersections, end];
        } else {
            // if the second constructor is used
            this.intersections = [];
            this.mapFields = [];
        }
    }

    addIntersections(points: Point2d[]) {
        this.intersections.push(...points);
        if (this.end != undefined) {
            points.pop();
            points.push(...points, this.end);
        }
    }

}