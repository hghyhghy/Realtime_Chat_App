

import { Controller, Post, UseInterceptors, UploadedFile, Req, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { Express } from 'express';
import { Response } from 'express';

@Controller()
export class ChatController {
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
          cb(null, uniqueFilename);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File, @Res() res:Response) {
    console.log('Received file:', file);
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    return res.status(201).json({ imageUrl: `http://localhost:3001/uploads/${file.filename}` });
  }
}
