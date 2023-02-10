import Player from "./Player";
import User from "./User";

export default class GameManager {

    private currentPlayers: Player[] = [];
    private _isWaiting = true;

    constructor() { }

    /**
     * Determines whether user pariticipates in the game.
     * @param userId {@link User | User's} id. 
     */
    isPlayerActive = (userId: number) => {
        for (let i = 0; i < this.currentPlayers.length; i++) {
            const player = this.currentPlayers[i];
            if (player.userId == userId)
                return true;
        }
        return false;
    };

    /**Adds {@link User} to current game ({@link GameManager}) */
    addPlayer = (user: User) => {
        this.currentPlayers.push(new Player(user));
    };


    public get isWaiting() {
        return this._isWaiting;
    }

}