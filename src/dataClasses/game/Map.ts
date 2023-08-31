import { Logger } from "@nestjs/common";
import SETTINGS from "../SETTINGS";
import Building from "./../../../../strategy-common/dataClasses/Building";
import MapField from "./../../../../strategy-common/dataClasses/MapField";
import Grassland from "./../../../../strategy-common/dataClasses/mapFields/Grassland";
import Unit from "../../../../strategy-common/dataClasses/Unit";
import { getMapFieldOfPoint } from "../../../../strategy-common/mapService";

export default class Map {
    fields: MapField[][] = [];

    constructor(
        readonly columns: number,
        readonly rows: number) {

        this.generateMap();
    }

    private generateMap = (): void => {
        for (let x = 0; x < this.columns; x++) {
            this.fields.push([]);
            for (let y = 0; y < this.rows; y++) {
                this.fields[x].push(new Grassland(x, y));
            }
        }
    };

    getStartMapField = (): MapField => {
        const x = Math.floor(Math.random() * this.columns);
        const y = Math.floor(Math.random() * this.rows);
        return this.fields[x][y];
    };

    // getMapFieldOfPosition = (x: number, y: number): MapField => {
    //     const column = Math.floor(x / SETTINGS.mapFieldSide);
    //     const row = Math.floor(y / SETTINGS.mapFieldSide);
    //     return this.fields[column][row];
    // };

    // getMapFieldsOfBuilding = (building: Building): MapField[] => {
    //     const widthHalf = building.width / 2;
    //     const lengthHalf = building.length / 2;

    //     let result = [];
    //     result.push(getMapFieldOfPosition(building.x - widthHalf, building.y + lengthHalf, this.fields));

    //     let field = getMapFieldOfPosition(building.x - widthHalf, building.y - lengthHalf, this.fields);
    //     if (!result.includes(field)) result.push(field);

    //     field = getMapFieldOfPosition(building.x + widthHalf, building.y - lengthHalf, this.fields);
    //     if (!result.includes(field)) result.push(field);

    //     field = getMapFieldOfPosition(building.x + widthHalf, building.y + lengthHalf, this.fields);
    //     if (!result.includes(field)) result.push(field);

    //     return result;
    // };

    // getMapFieldsOfUnit = (unit: Unit): MapField[] => {
    //     const widthHalf = unit.width / 2;
    //     const lengthHalf = unit.length / 2;

    //     let result = [];
    //     result.push(getMapFieldOfPosition(unit.x - widthHalf, unit.y + lengthHalf, this.fields));

    //     let field = getMapFieldOfPosition(unit.x - widthHalf, unit.y - lengthHalf, this.fields);
    //     if (!result.includes(field)) result.push(field);

    //     field = getMapFieldOfPosition(unit.x + widthHalf, unit.y - lengthHalf, this.fields);
    //     if (!result.includes(field)) result.push(field);

    //     field = getMapFieldOfPosition(unit.x + widthHalf, unit.y + lengthHalf, this.fields);
    //     if (!result.includes(field)) result.push(field);

    //     return result;
    // };

    //DEV
    getObservableMapFieldsFromPosition = (x: number, y: number): MapField[] => {
        const field = getMapFieldOfPoint(x, y, this.fields);
        const result = [];

        const minX = field.column - 5 >= 0 ? field.column - 5 : 0;
        const maxX = field.column + 5 < this.columns ? field.column + 5 : this.columns - 1;
        const minY = field.row - 5 >= 0 ? field.row - 5 : 0;
        const maxY = field.row + 5 < this.rows ? field.row + 5 : this.rows - 1;

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                result.push(this.fields[x][y]);
            }
        }
        return result;
    };
}