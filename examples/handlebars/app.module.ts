import { Module } from '@nestjs/common';
import { NestjsPdfModule } from '@shad0wz7/nestjs-pdf';
import { PdfController } from './handlebars-example';

@Module({
  imports: [
    NestjsPdfModule.forRoot({
      hbsOptions: {
        viewsDir: './templates',
        extname: '.hbs',
      },
    }),
  ],
  controllers: [PdfController],
})
export class AppModule {}
