import { SETTINGS } from "src/dataClasses/SETTINGS";
import Building from "../Building";
import BuildingsTypes from "./BuildingsTypes";

export default class MainBuilding extends Building {
    type = BuildingsTypes.MAIN;

    constructor(x: number, y: number) {
        super(x, y,
            5 * SETTINGS.unit,
            5 * SETTINGS.unit
        );
    }
}