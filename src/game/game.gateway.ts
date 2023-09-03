import { Logger, UseGuards } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WsException } from '@nestjs/websockets';
import { AuthService, InvalidTokenException } from 'src/auth/auth.service';
import { WsGuard } from 'src/auth/guards/ws-auth.guard';
import Game from 'src/dataClasses/Game';
import Building from './../../../strategy-common/dataClasses/Building';
import MapField from './../../../strategy-common/dataClasses/MapField';
import Player from './../../../strategy-common/dataClasses/Player';
import { GameService } from './game.service';
import { findUnit, instantiateBuilding, instantiatePoint, instantiateUnit } from "./../../../strategy-common/classInstantiatingService";
import Opponent from '../../../strategy-common/dataClasses/Opponent';
import MapChangesMessage from "./../../../strategy-common/socketioMessagesClasses/MapChangesMessage";
import BuildingWithIdentifiers from '../../../strategy-common/socketioMessagesClasses/BuildingWithIdentifiers';
import Unit from '../../../strategy-common/dataClasses/Unit';
import MoveUnitMessage from "./../../../strategy-common/socketioMessagesClasses/MoveUnitMessage";
import UnitMoveResponse from "./../../../strategy-common/socketioMessagesClasses/UnitMoveResponse";
import ReportUnitMoveMessage from "./../../../strategy-common/socketioMessagesClasses/ReportUnitMoveMessage";

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
   * Gets all available for the {@link Player} data.
   * @param client Socket of connection.
   * @returns Data about map, to which {@link Player} has access to.
   */
  @SubscribeMessage("init")
  init(client: any) {
    Logger.debug("Odebrano wydarzenie init.");
    const player: Player = client.player;
    const game: Game = client.game;
    if (player != undefined)
      return {
        event: "init",
        data: player.toJSON()
      };
    else throw new WsException("User has not joined any game");
  }

  @SubscribeMessage("building")
  building(client: any, data: BuildingWithIdentifiers) {
    Logger.debug("Odebrano wydarzenie building.");
    const game: Game = client.game;
    let building = instantiateBuilding(data);
    game.addBuilding(building, client.player);
  }

  @SubscribeMessage("unit")
  unit(client: any, data: Unit) {
    Logger.debug("Odebrano wydarzenie unit.");
    const game: Game = client.game;
    let unit = instantiateUnit(data);
    game.addUnit(unit, client.player);
  }

  @SubscribeMessage("moveUnit")
  moveUnit(client: any, data: MoveUnitMessage) {
    Logger.debug("odebrano wydarzenie moveUnit.");
    if (data.pathPoints.length == 0)
      throw new Error("Request contains empty pathPoints list.");
    const game: Game = client.game;
    const player: Player = client.player;
    let unit = findUnit(data.unit, player.units);
    let instantiatedPathPoints = data.pathPoints.map((pointData) => { return instantiatePoint(pointData); });
    game.moveUnit(data.id, player, unit, instantiatedPathPoints);
  }

  /**
   * Sends to {@link Player} information about joined opponent.
   * @param player Player, who is informed about joined opponent.
   * @param opponent Opponent data to send.
   */
  informThatOpponentJoined = (player: Player, opponent: Opponent) => {
    let socket = this.socketsOfPlayers.get(player.userId);
    if (!player.opponents.includes(opponent))
      throw new Error("Given opponent is not opponent of given player. Cannot send different player's opponent.");
    socket.emit("opponentJoined", opponent.getSimplified());
  };

  confirmBuildingPlaced(player: Player, placedBuilding: Building) {
    Logger.debug("Potwierdzam dodanie budynku.");
    let socket = this.socketsOfPlayers.get(player.userId);
    socket.emit("buildingPlaced", placedBuilding.getWithIdentifiers());
  }

  confirmUnitCreated(player: Player, createdUnit: Unit) {
    Logger.debug("Potwierdzam utworzenie jednostki.");
    let socket = this.socketsOfPlayers.get(player.userId);
    socket.emit("unitCreated", createdUnit);
  }

  confirmUnitMove(player: Player, movementId: string, movementStart: number) {
    Logger.debug("Zatwierdzam ruch jednostki.");
    let socket = this.socketsOfPlayers.get(player.userId);
    socket.emit("confirmUnitMove", { id: movementId, start: movementStart } as UnitMoveResponse);
  }

  rejectUnitMove(player: Player, movementId: string) {
    Logger.debug("Odrzucam ruch jednostki.");
    let socket = this.socketsOfPlayers.get(player.userId);
    socket.emit("rejectUnitMove", { id: movementId } as UnitMoveResponse);
  }

  reportUnitMove(player: Player, movementReport: ReportUnitMoveMessage) {
    Logger.debug("Raportuję obecne położenie jednostki.");
    let socket = this.socketsOfPlayers.get(player.userId);
    socket.emit("reportUnitMove", movementReport);
  }

  /**
   * Sends changed {@link MapField}s and {@link Building}s to client.
   * @param player Player is to notify about changes.
   * @param changedFields Map fields which have changed.
   * @param changedBuildings Buildings which have changed.
   */
  informAboutMapChanges = (
    player: Player,
    changedFields: MapField[] | null,
    changedBuildings: Building[] | null,
    changedUnits: Unit[] | null
  ) => {
    let socket = this.socketsOfPlayers.get(player.userId);
    let response: MapChangesMessage = {};

    if (changedFields && changedFields.length > 0)
      response.changedFields = changedFields.map((field) => { return field.getWithIdentifiers(); });

    if (changedBuildings && changedBuildings.length > 0)
      response.changedBuildings = changedBuildings.map((building) => { return building.getWithIdentifiers(); });

    if (changedUnits && changedUnits.length > 0)
      response.changedUnits = changedUnits.map((unit) => { return unit.getWithIdentifiers(); });

    socket.emit("mapChanges", response);
  };
}
