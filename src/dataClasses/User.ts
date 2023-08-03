import Game from "./Game";

export default class User {

    static lastId = 0;
    id: number = User.lastId++;
    public currentGame: Game = null;

    constructor(
        public name: string,
        public salt: string,
        public hash: string
    ) {

    }
}