export default class User {

    static lastId = 0;
    locationIds: string[] = [];
    id: number = User.lastId++;

    constructor(
        public name: string,
        public salt: string,
        public hash: string
    ) {

    }

    hasAccessTo(locationId: string) {
        return !(this.locationIds.every((checkedLocationId: string) => {
            return checkedLocationId !== locationId;
        }));
    }

}