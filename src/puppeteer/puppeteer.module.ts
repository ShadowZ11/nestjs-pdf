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
import { MjmlService } from './services/mjml.service';
import { PugService } from './services/pug.service';
import { EjsService } from './services/ejs.service';
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
  providers: [
    PuppeteerService,
    BrowserService,
    MjmlService,
    PugService,
    EjsService,
  ],
  exports: [PuppeteerService, MjmlService, PugService, EjsService],
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
      MjmlService,
      PugService,
      EjsService,
    ];

    return {
      module: PuppeteerModule,
      imports: [ConfigModule.forRoot()],
      providers,
      exports: [PuppeteerService, MjmlService, PugService, EjsService],
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
      imports: [...(options.imports ?? []), ConfigModule.forRoot()],
      providers: [
        pdfParamsProvider,
        hbsParamsProvider,
        PuppeteerService,
        BrowserService,
        HandlebarsService,
        MjmlService,
        PugService,
        EjsService,
      ],
      exports: [PuppeteerService, MjmlService, PugService, EjsService],
    };
  }
}
