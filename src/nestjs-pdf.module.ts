import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { NestjsPdfService } from './nestjs-pdf.service';
import { PuppeteerModule } from './puppeteer/puppeteer.module';
import { PuppeteerParameters } from './puppeteer/puppeteer-parameters.interface';

export interface PdfLibModuleAsyncOptions extends Pick<
  ModuleMetadata,
  'imports'
> {
  inject?: any[];
  useFactory: (...args: any[]) => any;
}

@Module({})
export class NestjsPdfModule {
  static forRoot(options: PuppeteerParameters): DynamicModule {
    return {
      module: NestjsPdfModule,
      imports: [PuppeteerModule.forRoot(options)],
      providers: [NestjsPdfService],
      exports: [NestjsPdfService],
    };
  }

  static forRootAsync(options: PdfLibModuleAsyncOptions): DynamicModule {
    return {
      module: NestjsPdfModule,
      imports: [PuppeteerModule.forRootAsync(options)],
      providers: [NestjsPdfService],
      exports: [NestjsPdfService],
    };
  }
}
