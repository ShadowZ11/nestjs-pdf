import { Module } from '@nestjs/common';
import { NestjsPdfModule } from '@shad0wz7/nestjs-pdf';

import { PdfController } from './ejs-example';

@Module({
  imports: [
    NestjsPdfModule.forRoot({
      ejsOptions: {
        cache: false,
      },
    }),
  ],
  controllers: [PdfController],
})
export class AppModule {}
