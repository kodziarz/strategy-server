import FieldsTypes from "./mapFields/FieldsTypes";

/**Class to extend to create MapFields containing something etc. */
export default abstract class MapField {
    /**Enables front-end to differentiate MapFields. */
    type: FieldsTypes;
}