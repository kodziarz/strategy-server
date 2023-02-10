import User from "./User";

/**
 * Stores player's game-connected data.
 * @see {@link User} - class which stores user-specific cross-game data.
 */
export default class Player {

    readonly userId: number;

    constructor(
        readonly user: User
    ) {
        this.userId = user.id;
    }
}