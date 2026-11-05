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

import { PDF_PARAMETERS } from '../helpers/tokens';
import { createPdfRenderer, usesPuppeteer } from '../renderers/create-renderer';
import { PDF_RENDERER } from '../renderers/pdf-renderer.interface';
import { BrowserService } from './browser/browser.service';
import { EjsService } from './engines/ejs/ejs.service';
import { EtaService } from './engines/eta/eta.service';
import { HandlebarsService } from './engines/handlebars/handlebars.service';
import { LiquidService } from './engines/liquid/liquid.service';
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

/** Builds the renderer of the configured provider, once the parameters are known. */
const pdfRendererProvider: Provider = {
  provide: PDF_RENDERER,
  inject: [PDF_PARAMETERS, BrowserService],
  useFactory: createPdfRenderer,
};

@Module({
  providers: [
    PuppeteerService,
    BrowserService,
    pdfRendererProvider,
    MjmlService,
    PugService,
    EjsService,
    NunjucksService,
    EtaService,
    MustacheService,
    LiquidService,
  ],
  exports: [
    PuppeteerService,
    MjmlService,
    PugService,
    EjsService,
    NunjucksService,
    EtaService,
    MustacheService,
    LiquidService,
  ],
})
export class PuppeteerModule implements OnModuleInit {
  readonly #browserService: BrowserService;
  readonly #pdfParams: PuppeteerParameters;

  constructor(
    browserService: BrowserService,
    @Inject(PDF_PARAMETERS) pdfParams: PuppeteerParameters,
  ) {
    this.#browserService = browserService;
    this.#pdfParams = pdfParams;
  }

  async onModuleInit() {
    if (usesPuppeteer(this.#pdfParams) && !this.#pdfParams.executablePath) {
      await this.#browserService.install(
        this.#pdfParams.useLockedBrowser ?? false,
      );
    }
  }

  static forRoot(pdfParameters: PuppeteerParameters): DynamicModule {
    const providers: Array<Provider> = [
      {
        provide: PDF_PARAMETERS,
        useValue: pdfParameters,
      },
      HandlebarsService,
      MjmlService,
      PugService,
      EjsService,
      NunjucksService,
      EtaService,
      MustacheService,
      LiquidService,
    ];

    return {
      module: PuppeteerModule,
      providers,
      exports: [
        PuppeteerService,
        MjmlService,
        PugService,
        EjsService,
        NunjucksService,
        EtaService,
        MustacheService,
        LiquidService,
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

    return {
      module: PuppeteerModule,
      imports: options.imports ?? [],
      providers: [
        pdfParamsProvider,
        PuppeteerService,
        BrowserService,
        pdfRendererProvider,
        HandlebarsService,
        MjmlService,
        PugService,
        EjsService,
        NunjucksService,
        EtaService,
        MustacheService,
        LiquidService,
      ],
      exports: [
        PuppeteerService,
        MjmlService,
        PugService,
        EjsService,
        NunjucksService,
        EtaService,
        MustacheService,
        LiquidService,
      ],
    };
  }
}
