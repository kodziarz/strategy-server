import BuildingsTypes from "./buildings/BuildingsTypes";

/**Class to extend to create specific buildings */
export default abstract class Building {
    /**Enables front-end to differentiate Buildings. */
    type: BuildingsTypes;

    id: string;

    x: number;
    y: number;
    width: number;
    length: number;
}