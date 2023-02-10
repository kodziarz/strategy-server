import { Logger } from '@nestjs/common';
import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway({
  cors: true
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  afterInit(server: any) {
    Logger.debug("Zainicjalizowano serwer");
  }
  handleConnection(client: any, ...args: any[]) {
    Logger.debug("Połączył się nowy klient.");
  }
  handleDisconnect(client: any) {
    Logger.debug("Rozłączył się klient.");
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }

  @SubscribeMessage("join")
  handleJoin(@MessageBody("data") data: string, @MessageBody("id") userId: number) {
    Logger.debug("Otrzymałem wiadomość od klienta: ");
    Logger.debug(data);
    Logger.debug("Klient ma id: ");
    Logger.debug(userId);
    return { event: "join", data: "Odebrałem, bez odbioru." };
  }
}
