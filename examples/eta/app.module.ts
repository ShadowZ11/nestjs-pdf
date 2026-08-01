import { Module } from '@nestjs/common';
import { NestjsPdfModule } from '@shad0wz7/nestjs-pdf';
import { PdfController } from './eta-example';

@Module({
  imports: [
    NestjsPdfModule.forRoot({
      etaOptions: {},
    }),
  ],
  controllers: [PdfController],
})
export class AppModule {}
