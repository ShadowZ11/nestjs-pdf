import { HandlebarsService } from '@gboutte/nestjs-hbs';
import { HandlebarsOptions } from '@gboutte/nestjs-hbs/dist/handlebars-options.interface';
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
import { ConfigModule } from '@nestjs/config';

import { HANDLEBARS_PARAMETERS, PDF_PARAMETERS } from '../helpers/tokens';
import { BrowserService } from './browser/browser.service';
import { EjsService } from './engines/ejs/ejs.service';
import { EtaService } from './engines/eta/eta.service';
import { MjmlService } from './engines/mjml/mjml.service';
import { MustacheService } from './engines/mustache/mustache.service';
import { NunjucksService } from './engines/nunjucks/nunjucks.service';
import { PugService } from './engines/pug/pug.service';
import { PuppeteerService } from './puppeteer.service';
import type { PuppeteerParameters } from './puppeteer-parameters.interface';

export interface PuppeteerModuleAsyncOptions extends Pick<
  ModuleMetadata,
  'imports'
> {
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
  useFactory: (
    ...args: Array<any>
  ) => Promise<PuppeteerParameters> | PuppeteerParameters;
}

@Module({
  providers: [
    PuppeteerService,
    BrowserService,
    MjmlService,
    PugService,
    EjsService,
    NunjucksService,
    EtaService,
    MustacheService,
  ],
  exports: [
    PuppeteerService,
    MjmlService,
    PugService,
    EjsService,
    NunjucksService,
    EtaService,
    MustacheService,
  ],
})
export class PuppeteerModule implements OnModuleInit {
  constructor(
    private readonly browserService: BrowserService,
    @Inject(PDF_PARAMETERS) private readonly pdfParams: PuppeteerParameters,
  ) {}

  async onModuleInit() {
    if (!this.pdfParams.executablePath) {
      await this.browserService.install(
        this.pdfParams.useLockedBrowser ?? false,
      );
    }
  }

  static forRoot(pdfParameters: PuppeteerParameters): DynamicModule {
    const providers: Array<Provider> = [
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
      NunjucksService,
      EtaService,
      MustacheService,
    ];

    return {
      module: PuppeteerModule,
      imports: [ConfigModule.forRoot()],
      providers,
      exports: [
        PuppeteerService,
        MjmlService,
        PugService,
        EjsService,
        NunjucksService,
        EtaService,
        MustacheService,
      ],
    };
  }

  static forRootAsync(options: PuppeteerModuleAsyncOptions): DynamicModule {
    const pdfParamsProvider: Provider = {
      provide: PDF_PARAMETERS,
      inject: options.inject ?? [],
      useFactory: async (...args: Array<unknown>) =>
        options.useFactory(...args),
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
        NunjucksService,
        EtaService,
        MustacheService,
      ],
      exports: [
        PuppeteerService,
        MjmlService,
        PugService,
        EjsService,
        NunjucksService,
        EtaService,
        MustacheService,
      ],
    };
  }
}
