import MapField from "./MapField";

export default class Map {
    mapFields: MapField[][];

    constructor(width: number, length: number) {
        // this.mapFields = (new Array(width)).fill(
        //     (new Array(length)).fill(new MapField())
        // );
    }
}