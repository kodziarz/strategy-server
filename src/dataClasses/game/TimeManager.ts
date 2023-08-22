/**
 * Manages time i.e. invokes all methods which last in time or need to be invoked continually.
 */
export default class TimeManager {

    public static INTERVAL = 1; // [s]
    private interval: NodeJS.Timer;
    private functionsToInvoke: TimeDependentFunction[] = [];
    readonly gameStartTime: number;

    constructor() {
        this.gameStartTime = Date.now();
        this.interval = setInterval(this.invokeMethods, TimeManager.INTERVAL * 1000);
    }

    invokeMethods = () => {
        let now = Date.now();
        this.functionsToInvoke.forEach((f) => {
            f((now - this.gameStartTime) / 1000, TimeManager.INTERVAL, now);
        });
    };

    subscribe = (invokedFunction: TimeDependentFunction) => {
        this.functionsToInvoke.push(invokedFunction);
    };

    unsubscribe = (invokedFunction: TimeDependentFunction) => {
        let index = this.functionsToInvoke.indexOf(invokedFunction);
        if (index == -1) {
            throw new Error("Such a function is not subscribed yet, so it cannot be unsubscribed");
        } else {
            this.functionsToInvoke.splice(index, 1);
        }
    };

}

type TimeDependentFunction = (elapsedTime: number, deltaTime: number, currentUnixTime: number) => void;