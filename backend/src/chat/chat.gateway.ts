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
    @MessageBody() data: { username?: string; content?: string; fileUrl?: string; fileType?: string; fileName?: string },
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

    let fileUrl: string | null = null;
    let fileType: string | null = null;
    let fileName: string | null = null;

    // Handle file upload
    if (data.fileUrl) {
      const base64Data = data.fileUrl.split(";base64,").pop();
      const extension = data.fileType?.split("/")[1] || "bin";
      const filePath = path.join(__dirname, "..", "uploads");

      // Ensure 'uploads' directory exists
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, { recursive: true });
      }

      const uniqueFileName = `${Date.now()}.${extension}`;
      const fullFilePath = path.join(filePath, uniqueFileName);

      fs.writeFileSync(fullFilePath, Buffer.from(base64Data!, "base64"));

      fileUrl = `/uploads/${uniqueFileName}`;
      fileType = data.fileType || "application/octet-stream";
      fileName = data.fileName || uniqueFileName;
    }

    // Validate message (if no text and no file, return an error)
    if (!data.content && !fileUrl) {
      console.error("Message content or file is required.");
      return { error: "Message content or file is required" };
    }

    // Create message with either text or file
    const message = await this.prisma.message.create({
      data: {
        content: data.content?.trim() || null,
        senderId: user.id,
        fileUrl,
        fileType,
        fileName,
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

  @SubscribeMessage('editMessage')
  async  handleEditMessage(@MessageBody() data:{id:number,content:string}){

    const {id,content} = data
    const updatedMessage  =  await this.prisma.message.update({

      where:{id:Number(id)},
      data:{content:content},
      include:{sender:true}
    })

    this.server.emit('updateMessage',updatedMessage )
    return updatedMessage
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(@MessageBody() data:{id:number}){

    const {id} = data
    const message =  await this.prisma.message.findUnique({

      where:{id:Number(id)}
    })

    if (!message) {
      console.error("Message not found.");
      return { error: "Message not found" };
    }

    if(message.fileUrl){

      const filePath  =  path.join(__dirname,"..",message.fileUrl)
      if(fs.existsSync(filePath)){

        fs.unlinkSync(filePath)
      }


    }

    await this.prisma.message.delete({where:{id:Number(id)}})
    return {success:true}
  }
}
