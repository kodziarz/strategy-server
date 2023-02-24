import { Logger } from "@nestjs/common";
import SETTINGS from "../SETTINGS";
import MapField from "./MapField";
import Grassland from "./mapFields/Grassland";

export default class Map {
    mapFields: MapField[][] = [];

    constructor(
        readonly columns: number,
        readonly rows: number) {

        this.generateMap();
    }

    private generateMap = (): void => {
        for (let x = 0; x < this.columns; x++) {
            this.mapFields.push([]);
            for (let y = 0; y < this.rows; y++) {
                this.mapFields[x].push(new Grassland(x, y));
            }
        }
    };

    getStartMapField = (): MapField => {
        const x = Math.floor(Math.random() * this.columns);
        const y = Math.floor(Math.random() * this.rows);
        return this.mapFields[x][y];
    };

    getMapFieldOfPosition = (x: number, y: number): MapField => {
        const column = Math.floor(x / SETTINGS.mapFieldSide);
        const row = Math.floor(y / SETTINGS.mapFieldSide);
        return this.mapFields[column][row];
    };

    //DEV
    getObservableMapFieldsFromPosition = (x: number, y: number): MapField[] => {
        const field = this.getMapFieldOfPosition(x, y);
        const result = [];

        const minX = field.column - 5 >= 0 ? field.column - 5 : 0;
        const maxX = field.column + 5 < this.columns ? field.column + 5 : this.columns;
        const minY = field.row - 5 >= 0 ? field.row - 5 : 0;
        const maxY = field.row + 5 < this.rows ? field.row + 5 : this.rows;

        for (let x = minX; x < maxX; x++) {
            for (let y = minY; y < maxY; y++) {
                result.push(this.mapFields[x][y]);
            }
        }
        return result;
    };
}