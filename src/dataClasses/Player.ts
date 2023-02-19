import Building from "./game/Building";
import MapField from "./game/MapField";
import User from "./User";

/**
 * Stores player's game-connected data.
 * @see {@link User} - class which stores user-specific cross-game data.
 */
export default class Player {

    readonly userId: number;
    /**
     * List of {@link MapField | MapFields} on which changes are instantly
     * sent to client.
     */
    readonly observedMapFields: MapField[] = [];
    /**
     * List of {@link MapField | MapFields} which were only visited and their state is not
     * instantly sent to client.
     * Stored {@link MapField | MapFields} are copies of fields from
     * {@link Map} created at the last moment the {@link MapField} was
     * observed.
     * List is sent after the {@link Player} joined game in case it is a
     * reconnection and that data is lost by client.
     */
    readonly visitedMapFields: MapField[] = [];
    /**List of {@link Building | Buildings} owned by player. */
    readonly buildings: Building[] = [];

    constructor(
        readonly user: User
    ) {
        this.userId = user.id;
    }
}