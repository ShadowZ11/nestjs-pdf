import {
  DynamicModule,
  Inject,
  InjectionToken,
  Module,
  ModuleMetadata,
  OnModuleInit,
  OptionalFactoryDependency,
  Provider,
} from '@nestjs/common';
import { PuppeteerService } from './puppeteer.service';
import { BrowserService } from './browser.service';
import { HANDLEBARS_PARAMETERS, PDF_PARAMETERS } from './helpers/tokens';
import type { PuppeteerParameters } from './puppeteer-parameters.interface';
import { ConfigModule } from '@nestjs/config';
import { HandlebarsService } from '@gboutte/nestjs-hbs';
import { HandlebarsOptions } from '@gboutte/nestjs-hbs/dist/handlebars-options.interface';

export interface PuppeteerModuleAsyncOptions extends Pick<
  ModuleMetadata,
  'imports'
> {
  inject?: (InjectionToken | OptionalFactoryDependency)[];
  useFactory: (
    ...args: any[]
  ) => Promise<PuppeteerParameters> | PuppeteerParameters;
}

@Module({
  providers: [PuppeteerService, BrowserService],
  exports: [PuppeteerService],
})
export class PuppeteerModule implements OnModuleInit {
  constructor(
    private readonly browserService: BrowserService,
    @Inject(PDF_PARAMETERS) private readonly pdfParams: PuppeteerParameters,
  ) {}

  async onModuleInit() {
    await this.browserService.install(this.pdfParams.useLockedBrowser ?? false);
  }

  static forRoot(pdfParameters: PuppeteerParameters): DynamicModule {
    const providers: Provider[] = [
      {
        provide: PDF_PARAMETERS,
        useValue: pdfParameters,
      },
      {
        provide: HANDLEBARS_PARAMETERS,
        useValue: pdfParameters.hbsOptions ?? {},
      },
      HandlebarsService,
    ];

    return {
      module: PuppeteerModule,
      imports: [
        ConfigModule.forRoot(), // on importe le module (global) pour HandlebarsService
      ],
      providers,
      exports: [PuppeteerService],
    };
  }

  static forRootAsync(options: PuppeteerModuleAsyncOptions): DynamicModule {
    const pdfParamsProvider: Provider = {
      provide: PDF_PARAMETERS,
      inject: options.inject ?? [],
      useFactory: async (...args: unknown[]) => options.useFactory(...args),
    };

    const hbsParamsProvider: Provider = {
      provide: HANDLEBARS_PARAMETERS,
      inject: [PDF_PARAMETERS],
      useFactory: (params: PuppeteerParameters): HandlebarsOptions =>
        params.hbsOptions ?? {},
    };

    return {
      module: PuppeteerModule,
      imports: [
        ...(options.imports ?? []),
        ConfigModule.forRoot(), // fournit HandlebarsService
      ],
      providers: [
        pdfParamsProvider,
        hbsParamsProvider,
        PuppeteerService,
        BrowserService,
        HandlebarsService,
      ],
      exports: [PuppeteerService],
    };
  }
}
