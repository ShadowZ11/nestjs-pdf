import { Module } from '@nestjs/common';
import { NestjsPdfModule } from '@shad0wz7/nestjs-pdf';

import { PdfController } from './nunjucks-example';

@Module({
  imports: [
    NestjsPdfModule.forRoot({
      nunjucksOptions: {},
    }),
  ],
  controllers: [PdfController],
})
export class AppModule {}
