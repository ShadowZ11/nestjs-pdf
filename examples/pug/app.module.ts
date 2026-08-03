import { Module } from '@nestjs/common';
import { NestjsPdfModule } from '@shad0wz7/nestjs-pdf';
import { PdfController } from './pug-example';

@Module({
  imports: [
    NestjsPdfModule.forRoot({
      pugOptions: {
        pretty: false,
      },
    }),
  ],
  controllers: [PdfController],
})
export class AppModule {}
