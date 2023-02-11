import Building from "./gameManager/Building";
import Map from "./gameManager/Map";
import Player from "./Player";
import User from "./User";

/**Stores data about specific game. */
export default class Game {

    private map: Map;
    private currentPlayers: Player[] = [];
    private buildings: Building[] = [];
    private _isWaiting = true;

    constructor() {
        this.map = new Map(20, 20);
    }

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

    /**Adds {@link User} to current game ({@link Game}) */
    addPlayer = (user: User) => {
        this.currentPlayers.push(new Player(user));
    };


    public get isWaiting() {
        return this._isWaiting;
    }

}