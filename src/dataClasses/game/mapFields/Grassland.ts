import MapField from "../MapField";
import FieldsTypes from "./FieldsTypes";

export default class Grassland extends MapField {
    type = FieldsTypes.GRASSLAND;

    constructor(column: number, row: number) {
        super(column, row);
    }
}