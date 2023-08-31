import Building from "../../../../strategy-common/dataClasses/Building";
import MapField from "../../../../strategy-common/dataClasses/MapField";
import Opponent from "../../../../strategy-common/dataClasses/Opponent";
import Player from "../../../../strategy-common/dataClasses/Player";
import Unit from "../../../../strategy-common/dataClasses/Unit";
import { getMapFieldsOfBuilding, getMapFieldsOfUnit } from "../../../../strategy-common/mapService";
import Map from "./Map";

/**
 * Contains methods used by inserting data already stored data structure.
 */
export default class DataBinder {

    private currentPlayers: Player[];
    /**Map of the game. This field is needed because some methods need to
     * determine which fields are visible from some specific point. If the
     * way of finding it changed, this field could be removed.
     */
    private map: Map;

    /**
     * Creates New {@link DataBinder}.
     * @param currentPlayers Table of current {@link Player}s in the game
     * (should be exactly the same as in {@link Game}).
     */
    constructor(currentPlayers: Player[], map: Map) {
        this.currentPlayers = currentPlayers;
        this.map = map;
    }

    /**
     * Inserts new player into other players and vice versa.
     * @param newPlayer New created player, who needs to be inserted into data
     * structure.
     * @returns List of objects containing opponent's {@link Player}s and their
     * {@link Opponent} objects concerning {@link newPlayer}.
     */
    insertNewPlayer = (newPlayer: Player): {
        opponentPlayer: Player,
        opponentData: Opponent;
    }[] => {

        let opponentPlayersToOpponentsMap: {
            opponentPlayer: Player,
            opponentData: Opponent;
        }[] = [];

        this.currentPlayers.forEach((opponentPlayer) => {

            // adds another player as opponent to the player
            let alreadyExistingOpponentData = new Opponent(opponentPlayer.userId);
            newPlayer.opponents.push(alreadyExistingOpponentData);

            // add player as an opponent to other players
            let addedPlayerOpponentData = new Opponent(newPlayer.userId);
            opponentPlayer.opponents.push(addedPlayerOpponentData);
            opponentPlayersToOpponentsMap.push({
                opponentPlayer,
                opponentData: addedPlayerOpponentData
            });
        });
        this.currentPlayers.push(newPlayer);
        return opponentPlayersToOpponentsMap;
    };

    /**
     * Checks, if opponents have any buildings or units on {@link newObservedMapFields}
     * and inserts them into player's opponent data.
     * @param player Player, who needs to get opponents' data from newObservedFields.
     * @param newObservedMapFields Fields, where potential buildings and units to
     * insert may occur.
     */
    addOpponentsBuildingsAndUnitsToPlayer = (
        player: Player,
        newObservedMapFields: MapField[]
    ): { newObservedBuildings: Building[]; newObservedUnits: Unit[]; } => {
        // I am aware of the fact, that this method is not quite legible, that is why it is so precisely documented
        let opponentsNewBuildings = new Set<Building>();
        let opponentsNewUnits = new Set<Unit>();
        newObservedMapFields.forEach((newObservedMapField) => {
            newObservedMapField.buildings.forEach((newObservedBuilding) => {
                if (newObservedBuilding.ownerId != player.userId)
                    opponentsNewBuildings.add(newObservedBuilding);
            });
            newObservedMapField.units.forEach((newObservedUnit) => {
                if (newObservedUnit.ownerId != player.userId)
                    opponentsNewUnits.add(newObservedUnit);
            });
        });

        opponentsNewBuildings.forEach((newObservedBuilding) => {
            //now it needs to be checked, if player has already seen the building (invalid copy of it could be on visitedMapField)
            let opponent = player.getOpponentById(newObservedBuilding.ownerId);
            let currentBuilding = opponent.buildings.find((checkedBuilding) => { return checkedBuilding.id == newObservedBuilding.id; });
            if (currentBuilding) {
                //if the building was observed
                let index = opponent.buildings.indexOf(currentBuilding);
                opponent.buildings.splice(index, 1); //removes old item from array
            }
            opponent.buildings.push(newObservedBuilding);
        });

        opponentsNewUnits.forEach((newObservedUnit) => {
            //now it needs to be checked, if player has already seen the unit (invalid copy of it could be on visitedMapField)
            let opponent = player.getOpponentById(newObservedUnit.ownerId);
            let currentUnit = opponent.units.find((checkedUnit) => { return checkedUnit.id == newObservedUnit.id; });
            if (currentUnit) {
                //if the unit was observed
                let index = opponent.units.indexOf(currentUnit);
                opponent.buildings.splice(index, 1); //removes old item from array
            }
            opponent.units.push(newObservedUnit);
        });

        return {
            newObservedBuildings: Array.from(opponentsNewBuildings),
            newObservedUnits: Array.from(opponentsNewUnits)
        };
    };

    /**
     * Inserts building into all necessary data structures. Does not send this
     * data to clients.
     * Data is insterted into: player.buildings, fields in this.map, opponentPlayers.opponent.buildings
     * @param player Owner of the placed building.
     * @param building Placed building.
     */
    insertBuilding = (player: Player, building: Building) => {
        player.buildings.push(building);

        let changedMapFields = getMapFieldsOfBuilding(building, this.map.fields);
        changedMapFields.forEach((changedMapFiled) => {
            changedMapFiled.buildings.push(building);
        });

        this.currentPlayers.forEach((updatedPlayer) => {
            if (updatedPlayer != player) {
                let isObserved = false;
                for (let changedMapField of changedMapFields) {
                    if (updatedPlayer.observedMapFields.includes(changedMapField)) {
                        isObserved = true;
                        break;
                    }
                }
                if (isObserved) {
                    let opponent = updatedPlayer.getOpponentById(player.userId);
                    opponent.buildings.push(building);
                }
            }
        });

        building.occupiedFields.push(...changedMapFields);
    };

    /**
     * Inserts {@link Unit} into all necessary data structures. Does not send this
     * data to clients.
     * Data is insterted into: player.units, fields in this.map, opponentPlayers.opponent.units
     * @param player Owner of the placed unit.
     * @param unit Placed unit.
     */
    insertUnit = (player: Player, unit: Unit) => {
        player.units.push(unit);

        let changedMapFields = getMapFieldsOfUnit(unit, this.map.fields);
        changedMapFields.forEach((changedMapFiled) => {
            changedMapFiled.units.push(unit);
        });

        this.currentPlayers.forEach((updatedPlayer) => {
            if (updatedPlayer != player) {
                let isUnitObserved = false;
                for (let changedMapField of changedMapFields) {
                    if (updatedPlayer.observedMapFields.includes(changedMapField)) {
                        isUnitObserved = true;
                        break;
                    }
                }
                if (isUnitObserved) {
                    let opponent = updatedPlayer.getOpponentById(player.userId);
                    opponent.units.push(unit);
                }
            }
        });

        unit.occupiedFields.push(...changedMapFields);
    };
}