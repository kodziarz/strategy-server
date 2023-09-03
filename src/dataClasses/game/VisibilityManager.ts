import Building from "../../../../strategy-common/dataClasses/Building";
import MapField from "../../../../strategy-common/dataClasses/MapField";
import Player from "../../../../strategy-common/dataClasses/Player";
import Unit from "../../../../strategy-common/dataClasses/Unit";
import Map from "./Map";

export default class VisibilityManager {

    map: Map;

    constructor(map: Map) {
        this.map = map;
    }

    getNewObservedMapFieldsFromPosition = (x: number, y: number, player: Player) => {
        let observedFields = this.map.getObservableMapFieldsFromPosition(x, y);
        let newObservedFields: MapField[] = [];
        for (let i = 0; i < observedFields.length; i++) {
            const observedField = observedFields[i];
            if (!player.observedMapFields.find((alreadyObsevedField) => {
                return alreadyObsevedField == observedField;
            }))
                newObservedFields.push(observedField);
        }
        return newObservedFields;
    };

    // getNewBuildingsFromNewObservedFields = (newObservedFields: MapField[]) => {
    //     let discoveredBuildings = new Set<Building>();
    //     newObservedFields.forEach((newObservedField) => {
    //         //every building on discovered mapFields is new (even if was noticed
    //         //before - then client stores the old state of it.)
    //         newObservedField.buildings.forEach((building) => {
    //             discoveredBuildings.add(building);
    //         });
    //     });
    //     return Array.from(discoveredBuildings);
    // };

    // getNewUnitsFromNewObservedFields = (newObservedFields: MapField[]) => {
    //     let discoveredUnits = new Set<Unit>();
    //     newObservedFields.forEach((newObservedField) => {
    //         //every unit on discovered mapFields is new (even if was noticed
    //         //before - then client stores the old state of it.)
    //         newObservedField.units.forEach((unit) => {
    //             discoveredUnits.add(unit);
    //         });
    //     });
    //     return Array.from(discoveredUnits);
    // };
}