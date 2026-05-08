import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { PdfLibService } from './pdf-lib.service';
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
export class PdfLibModule {
  static forRoot(options: PuppeteerParameters): DynamicModule {
    return {
      module: PdfLibModule,
      imports: [PuppeteerModule.forRoot(options)],
      providers: [PdfLibService],
      exports: [PdfLibService],
    };
  }

  static forRootAsync(options: PdfLibModuleAsyncOptions): DynamicModule {
    return {
      module: PdfLibModule,
      imports: [PuppeteerModule.forRootAsync(options)],
      providers: [PdfLibService],
      exports: [PdfLibService],
    };
  }
}
