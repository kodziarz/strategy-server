import { Logger, UseGuards } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WsException } from '@nestjs/websockets';
import { AuthService, InvalidTokenException } from 'src/auth/auth.service';
import { WsGuard } from 'src/auth/guards/ws-auth.guard';
import Game from 'src/dataClasses/Game';
import Building from './../../../strategy-common/dataClasses/Building';
import MapField from './../../../strategy-common/dataClasses/MapField';
import Player from './../../../strategy-common/dataClasses/Player';
import { GameService } from './game.service';
import { instantiateBuilding } from "./../../../strategy-common/classInstantiatingService";

@UseGuards(WsGuard)
@WebSocketGateway({
  cors: true
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  private socketsOfPlayers: Map<number, any> = new Map();
  constructor(
    private readonly authService: AuthService,
    private readonly gameService: GameService
  ) {
    gameService.setGameGateway(this);
  }

  afterInit(server: any) {
    Logger.debug("Zainicjalizowano serwer");
  }


  handleConnection(client: any, ...args: any[]) {
    // verifies token, because the function is invoked before Guard's canActivate function
    try {
      let payload = this.authService.verifyToken(client.handshake.headers.authorization.split(" ")[1]);
      this.socketsOfPlayers.set(payload.sub, client);
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
        data: player
      };
    else throw new WsException("User has not joined any game");
  }

  @SubscribeMessage("building")
  building(client: any, data: Building) {
    Logger.debug("Odebrano wydarzenie building.");
    let building = instantiateBuilding(data);
    const game: Game = client.game;
    game.addBuilding(building, client.player);
  }

  confirmBuildingPlaced(player: Player, placedBuilding: Building) {
    Logger.debug("Potwierdzam dodanie budynku.");
    let socket = this.socketsOfPlayers.get(player.userId);
    socket.emit("buildingPlaced", {
      placedBuilding
    });
  }


  /**
   * Handles {@link Game | Game's} event that observed map fields have changed.
   * Sends them to the given player.
   * @param player Player whoose observed map fields have changed.
   * @param changedFields Map fields which have changed.
   */
  informAboutChangedMapFields = (player: Player, changedFields: MapField[]) => {
    let socket = this.socketsOfPlayers.get(player.userId);
    socket.emit("map", {
      observedMapFields: changedFields
    });
  };

  /**
   * Sends changed {@link Building | Buildings} to the given player.
   * @param player Player who is eligible to know about change.
   * @param changedBuildings Buildings which have been changed.
   */
  informAboutChangedBuildings = (player: Player, changedBuildings: Building[]) => {
    let socket = this.socketsOfPlayers.get(player.userId);
    socket.emit("opponent", {
      opponentId: player.userId,
      changedBuildings: changedBuildings
    });
  };
}
