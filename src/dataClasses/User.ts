export default class User {

    static lastId = 0;
    id: number = User.lastId++;

    constructor(
        public name: string,
        public salt: string,
        public hash: string
    ) {

    }
}