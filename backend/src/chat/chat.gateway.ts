import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { PrismaService } from "../prisma.service";
import * as fs from "fs";
import * as path from "path";



@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private prisma: PrismaService) {}

  @SubscribeMessage("sendMessage")
  async handleMessage(
    @MessageBody() data: { username?: string; content?: string; imageUrl?: string },
    @ConnectedSocket() client: Socket
  ) {
    // Validate username
    if (!data.username || data.username.trim() === "") {
      console.error("Username is missing in message data.");
      return { error: "Username is required" };
    }

    const formattedUsername = data.username.trim();

    // Find user case-insensitively
    let user = await this.prisma.user.findFirst({
      where: { username: { equals: formattedUsername } },
    });

    // If user doesn't exist, create them
    if (!user) {
      console.log(`User ${formattedUsername} not found. Creating new user...`);
      user = await this.prisma.user.create({
        data: { username: formattedUsername },
      });
    }

    let imageUrl: string | null = null;

    // If an image is sent, store it
    if (data.imageUrl) {
      const base64Data = data.imageUrl.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `image_${Date.now()}.png`; // Unique filename
      const filePath = path.join(__dirname, "..", "uploads", fileName);

      // Ensure 'uploads' directory exists
      if (!fs.existsSync(path.join(__dirname, "..", "uploads"))) {
        fs.mkdirSync(path.join(__dirname, "..", "uploads"), { recursive: true });
      }

      fs.writeFileSync(filePath, buffer);
      imageUrl = `/uploads/${fileName}`;
    }

    // Validate message (if no text and no image, return an error)
    if (!data.content && !data.imageUrl) {
      console.error("Message content or image is required.");
      return { error: "Message content or image is required" };
    }

    // Create message with either text or image URL
    const message = await this.prisma.message.create({
      data: {
        content: data.content?.trim() || null, // Store content if available
        senderId: user.id,
        imageUrl: data.imageUrl || null, // Store imageUrl if present
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
