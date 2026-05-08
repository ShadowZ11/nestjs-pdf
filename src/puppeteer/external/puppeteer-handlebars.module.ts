import {
  DynamicModule,
  InjectionToken,
  Module,
  OptionalFactoryDependency,
  Provider,
} from '@nestjs/common';
import { HandlebarsService } from '@gboutte/nestjs-hbs';
import type { HandlebarsOptions } from '@gboutte/nestjs-hbs/dist/handlebars-options.interface';

export interface PuppeteerHandlebarsModuleAsyncOptions {
  imports?: DynamicModule[]; // optionnel
  inject?: (InjectionToken | OptionalFactoryDependency)[];
  useFactory: (
    ...args: unknown[]
  ) => Promise<HandlebarsOptions> | HandlebarsOptions;
}

@Module({
  providers: [HandlebarsService],
  exports: [HandlebarsService],
})
export class PuppeteerHandlebarsModule {
  static forRoot(handlebarsOptions: HandlebarsOptions): DynamicModule {
    return {
      module: PuppeteerHandlebarsModule,
      providers: [
        {
          provide: 'HANDLEBARS_PARAMETERS',
          useValue: handlebarsOptions,
        },
      ],
      exports: [HandlebarsService],
    };
  }

  static forRootAsync(
    options: PuppeteerHandlebarsModuleAsyncOptions,
  ): DynamicModule {
    const provider: Provider = {
      provide: 'HANDLEBARS_PARAMETERS',
      inject: options.inject ?? [],
      useFactory: async (...args: unknown[]) => options.useFactory(...args),
    };

    return {
      module: PuppeteerHandlebarsModule,
      imports: options.imports ?? [],
      providers: [provider],
      exports: [HandlebarsService],
    };
  }
}
