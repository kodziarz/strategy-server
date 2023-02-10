export default class User {

    static lastId = 0;
    locationIds: string[] = [];
    id: number = User.lastId++;
    token: string = null;

    constructor(
        public name: string,
        public salt: string,
        public hash: string
    ) {

    }

    hasAccessTo(LocationId: string) {
        return !(this.locationIds.every((locationId: string) => {
            return locationId !== locationId;
        }));
    }

}