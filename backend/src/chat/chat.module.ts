
import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { PrismaModule } from 'src/prisma.module';

@Module({
  imports:[PrismaModule],
  controllers: [ChatController], // Register the ChatController
  providers: [ChatGateway], // Register ChatService
  exports: [ChatGateway], // Export if used elsewhere
})
export class ChatModule {}
