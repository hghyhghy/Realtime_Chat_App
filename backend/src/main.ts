import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import * as serveStatic from 'serve-static';
import * as express from 'express';

async function bootstrap() {
  // Explicitly use NestExpressApplication for static asset handling
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS
  app.enableCors({
    origin: '*', // Allow all origins (change this for security)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // Allow cookies/auth headers if needed
  });

  // Serve static files (uploaded images)
  app.useStaticAssets(path.join(__dirname, '..', 'uploads'), { prefix: '/uploads' });
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));


  await app.listen(process.env.PORT ?? 3001);
  console.log(`🚀 Server running on http://localhost:${process.env.PORT ?? 3001}`);
}

bootstrap();
