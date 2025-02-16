import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*', // Allow all origins (change this for security)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Allow cookies/auth headers if needed
  });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
