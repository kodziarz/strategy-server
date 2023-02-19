import CommoditiesTypes from "./commodities/CommoditiesTypes";

/**Class to extend to create specific commodities. */
export default abstract class Commodity {
    type: CommoditiesTypes;
}