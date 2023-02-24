import { Logger, UseGuards } from '@nestjs/common';
import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WsException } from '@nestjs/websockets';
import { AuthService, InvalidTokenException } from 'src/auth/auth.service';
import { WsGuard } from 'src/auth/guards/ws-auth.guard';
import Game from 'src/dataClasses/Game';
import Player from 'src/dataClasses/Player';

@UseGuards(WsGuard)
@WebSocketGateway({
  cors: true
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  constructor(private readonly authService: AuthService) { }

  afterInit(server: any) {
    Logger.debug("Zainicjalizowano serwer");
  }


  handleConnection(client: any, ...args: any[]) {
    // verifies token, because the function is invoked before Guard's canActivate function
    try {
      let payload = this.authService.verifyToken(client.handshake.headers.authorization.split(" ")[1]);
      Logger.debug("Połączył się nowy klient o id: ", payload.sub);
    } catch (error) {
      if (error instanceof InvalidTokenException) {
        Logger.debug("Klient posiada nieważny token.");
        client.disconnect();
      }
    }
  }
  handleDisconnect(client: any) {
    Logger.debug("Rozłączył się klient.");
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }

  @SubscribeMessage("test")
  test(client: any) {
    Logger.debug("Połączono na wydarzenie test na sockecie");
    Logger.debug(client.user);
    Logger.debug(client.game);
    Logger.debug(client.player);
  }

  /**
   * Gets all available for the {@link Player} data about map.
   * @param client Socket of connection.
   * @returns Data about map, to which {@link Player} has access to.
   */
  @SubscribeMessage("map")
  map(client: any) {
    Logger.debug("Odebrano wydarzenie map.");
    const player: Player = client.player;
    const game: Game = client.game;
    if (player != undefined)
      return {
        event: "map",
        data: {
          buildings: player.buildings,
          observedMapFields: player.observedMapFields,
          visitedMapFields: player.visitedMapFields,
          rows: game.getRows(),
          columns: game.getColumns()
        }
      };
    else throw new WsException("User has not joined any game");
  }
}
