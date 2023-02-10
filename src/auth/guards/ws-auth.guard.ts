import { CanActivate, Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";
import JwtPayload from "src/dataClasses/JwtPayload";
import { UsersService } from "src/users/users.service";

/*
Źródło: https://stackoverflow.com/questions/58670553/nestjs-gateway-websocket-how-to-send-jwt-access-token-through-socket-emit
Na front-endzie:
this.socketOptions = {
    transportOptions: {
        polling: {
            extraHeaders: {
                Authorization: 'your token', // 'Bearer h93t4293t49jt34j9rferek...'
            }
        }
    }
};
// ...
this.socket = io.connect('http://localhost:4200/', this.socketOptions);
// ...

*/


@Injectable()
export class WsGuard implements CanActivate {

    constructor(
        private usersService: UsersService,
        private readonly jwtService: JwtService
    ) { }

    canActivate(
        context: any,
    ): boolean | any | Promise<boolean | any> | Observable<boolean | any> {
        const bearerToken = context.args[0].handshake.headers.authorization.split(' ')[1];
        try {
            const decoded = this.jwtService.verify(bearerToken) as JwtPayload;
            return new Promise(async (resolve, reject) => {

                let user = await this.usersService.getUserById(decoded.sub);
                if (user)
                    resolve(user);
                else
                    reject(false);

            });
        } catch (ex) {
            Logger.error(ex);
            return false;
        }
    }
}