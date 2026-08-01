import { Module } from '@nestjs/common';
import { NestjsPdfModule } from '@shad0wz7/nestjs-pdf';
import { PdfController } from './mjml-example';

@Module({
  imports: [
    NestjsPdfModule.forRoot({
      mjmlOptions: {},
    }),
  ],
  controllers: [PdfController],
})
export class AppModule {}
