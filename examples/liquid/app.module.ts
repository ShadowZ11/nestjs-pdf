import { Module } from '@nestjs/common';
import { NestjsPdfModule } from '@shad0wz7/nestjs-pdf';

import { PdfController } from './liquid-example';

@Module({
  imports: [
    NestjsPdfModule.forRoot({
      liquidOptions: {},
    }),
  ],
  controllers: [PdfController],
})
export class AppModule {}
