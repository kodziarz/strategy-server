export default class SETTINGS {
    /**
     * Unit of position.
     * Should be used in every setting relating to position
     * on {@link Map}.
     * Aim is to be able to scale all the settings easily. 
     */
    static readonly unit = 1;
    /**Distance which is visible for observer on the {@link Map}. */
    static readonly visibilityRadius = 5 * SETTINGS.unit;
    /**Length of {@link MapField} side. */
    static readonly mapFieldSide = 20 * SETTINGS.unit;
};