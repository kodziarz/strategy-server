import SETTINGS from "../SETTINGS";
import FieldsTypes from "./mapFields/FieldsTypes";

/**Class to extend to create MapFields containing something etc. */
export default abstract class MapField {
    /**Enables front-end to differentiate MapFields. */
    type: FieldsTypes;

    /**Integer indicating which in a row is this {@link MapField} horizonally */
    readonly column: number;
    /**Integer indicating which in a row is this {@link MapField} vertically */
    readonly row: number;
    /**Accurate X coordinate of {@link MapField | MapField's} center.*/
    readonly x: number;
    /**Accurate Y coordinate of {@link MapField | MapField's} center.*/
    readonly y: number;

    constructor(
        column: number,
        row: number
    ) {
        this.column = column;
        this.row = row;

        this.x = (this.column + 0.5) * SETTINGS.mapFieldSide;
        this.y = (this.row + 0.5) * SETTINGS.mapFieldSide;
    }
}