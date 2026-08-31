import { Module } from '@nestjs/common';
import { NestjsPdfModule } from '@shad0wz7/nestjs-pdf';

import { PdfController } from './mustache-example';

@Module({
  imports: [
    NestjsPdfModule.forRoot({
      mustacheOptions: {},
    }),
  ],
  controllers: [PdfController],
})
export class AppModule {}
