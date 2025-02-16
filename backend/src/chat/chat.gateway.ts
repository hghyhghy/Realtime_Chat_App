import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { PrismaService } from "../prisma.service";

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private prisma: PrismaService) {}

  @SubscribeMessage("sendMessage")
  async handleMessage(
    @MessageBody() data: { username?: string; content: string },
    @ConnectedSocket() client: Socket
  ) {
    // Ensure username is provided
    if (!data.username || data.username.trim() === "") {
      console.error("Username is missing in message data.");
      return { error: "Username is required" };
    }
    const formattedUsername = data.username.trim().toLowerCase()
    // Find user by username
    let user = await this.prisma.user.findUnique({
      where: { username:  formattedUsername },
    });
  
    // If user doesn't exist, create them
    if (!user) {
      console.log(`User ${data.username} not found. Creating new user...`);
      user = await this.prisma.user.create({
        data: { username: formattedUsername },
      });
    }
  
    // Create message
    const message = await this.prisma.message.create({
      data: {
        content: data.content,
        senderId: user.id,
      },
      include: { sender: true },
    });
  
    this.server.emit("newMessage", message);
    return message;
  }
  

  @SubscribeMessage("getMessages")
  async getMessages(@ConnectedSocket() client: Socket) {
    const messages = await this.prisma.message.findMany({
      include: { sender: true },
      orderBy: { createdAt: "asc" },
    });

    client.emit("getMessages", messages);
  }
}
