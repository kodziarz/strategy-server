import { CanActivate, ExecutionContext, Inject, Injectable, Logger } from "@nestjs/common";
import { Socket } from "socket.io";
import JwtPayload from "src/dataClasses/JwtPayload";
import { GameService } from "src/game/game.service";
import { UsersService } from "src/users/users.service";
import { AuthService } from "../auth.service";

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
        @Inject(UsersService) private readonly usersService: UsersService,
        @Inject(AuthService) private readonly authService: AuthService,
        @Inject(GameService) private readonly gameService: GameService
    ) { }

    canActivate(
        context: ExecutionContext,
    ): Promise<boolean | any> {
        return new Promise(async (resolve, reject) => {
            let client: Socket = context.switchToWs().getClient<Socket>();
            let bearerToken = client.handshake.headers.authorization.split(" ")[1];
            // const bearerToken = context.args[0].handshake.headers.authorization.split(' ')[1];
            try {
                const decoded = this.authService.verifyToken(bearerToken) as JwtPayload;

                let user = await this.usersService.getUserById(decoded.sub);
                Object.assign(client, { user });

                if (user != undefined) {
                    let game = this.gameService.getGameOfUser(user.id);
                    Object.assign(client, { game });

                    if (game != undefined) {
                        let player = game.getPlayerByUserId(user.id);
                        Object.assign(client, { player });
                    }
                }


                if (user)
                    resolve(user);
                else
                    reject(false);

            } catch (ex) {
                Logger.error(ex);
                resolve(false);
            }
        });
    }
}