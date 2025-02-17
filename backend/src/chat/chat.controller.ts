import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Response } from 'express';
import { extname } from 'path';

// Allowed file types
const ALLOWED_FILE_TYPES = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.docx', '.ppt'];

@Controller()
export class ChatController {
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',  // Ensure uploads folder is correctly defined
        filename: (req, file, cb) => {
          const fileExt = extname(file.originalname).toLowerCase();
          
          // Validate file type
          if (!ALLOWED_FILE_TYPES.includes(fileExt)) {
            return cb(new BadRequestException('Invalid file type'), '');
          }
          
          // Save file with original name (no timestamp)
          const filename = file.originalname;
          
          cb(null, filename);  // Use original filename
        },
      }),
      fileFilter: (req, file, cb) => {
        const fileExt = extname(file.originalname).toLowerCase();
        if (ALLOWED_FILE_TYPES.includes(fileExt)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type'), false);
        }
      },
    })
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Res() res: Response) {
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Return the full path without timestamp, use the original filename
    return res.status(201).json({
      fileUrl: `uploads/${file.filename}`,  // File name without timestamp
      fileType: file.mimetype,
      fileName: file.originalname,
    });
  }
}
