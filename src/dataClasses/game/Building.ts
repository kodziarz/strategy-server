import BuildingsTypes from "./buildings/BuildingsTypes";
import { v4 as uuidv4 } from "uuid";

/**Class to extend to create specific buildings */
export default abstract class Building {
    /**Enables front-end to differentiate Buildings. */
    type: BuildingsTypes;

    readonly id: string;

    constructor(
        readonly x: number,
        readonly y: number,
        readonly width: number,
        readonly length: number,
    ) {
        this.id = uuidv4();
    }
}