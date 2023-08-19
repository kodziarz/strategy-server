import { Logger } from "@nestjs/common";

/**
 * Manages time i.e. invokes all methods which last in time or need to be invoked continually.
 */
export default class TimeManager {

    public static INTERVAL = 5000;
    private interval: NodeJS.Timer;
    private functionsToInvoke: TimeDependentFunction[] = [];

    constructor() {
        this.interval = setInterval(this.invokeMethods, TimeManager.INTERVAL);
    }

    invokeMethods = () => {
        Logger.debug("Invocation of subscribed functions needs to be implemented.");
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

type TimeDependentFunction = (intervenedTime: number, deltaTime: number, currentUnixTime: number) => void;