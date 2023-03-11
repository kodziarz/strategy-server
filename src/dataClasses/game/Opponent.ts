import Building from "./Building";

/**Stroes data which is known to specific {@link Player} about his opponent. */
export default class Opponent {


    buildings: Building[] = [];

    constructor(readonly userId: number) { }
}