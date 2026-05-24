import { Injectable } from '@nestjs/common';
import { configure, ConfigureOptions, render, renderString } from 'nunjucks';

export interface NunjucksOptions extends Partial<ConfigureOptions> {
  noCache?: boolean;
  watch?: boolean;
  throwOnUndefined?: boolean;
  trimBlocks?: boolean;
  lstripBlocks?: boolean;
}

@Injectable()
export class NunjucksService {
  constructor() {
    // Configure default Nunjucks environment
    configure({
      noCache: true,
      trimBlocks: true,
      lstripBlocks: true,
    });
  }

  render(
    template: string,
    data: Record<string, unknown> = {},
    options?: NunjucksOptions,
  ) {
    try {
      if (options) {
        const configOptions: Record<string, unknown> = {
          noCache: options.noCache ?? true,
          watch: options.watch ?? false,
          throwOnUndefined: options.throwOnUndefined ?? false,
          trimBlocks: options.trimBlocks ?? true,
          lstripBlocks: options.lstripBlocks ?? true,
        };
        configure(configOptions as ConfigureOptions);
      }
      return renderString(template, data);
    } catch (error) {
      throw new Error(`Nunjucks rendering failed: ${String(error)}`, {
        cause: error,
      });
    }
  }

  renderFile(
    filePath: string,
    data: Record<string, unknown> = {},
    options?: NunjucksOptions,
  ) {
    try {
      if (options) {
        const configOptions: Record<string, unknown> = {
          noCache: options.noCache ?? true,
          watch: options.watch ?? false,
          throwOnUndefined: options.throwOnUndefined ?? false,
          trimBlocks: options.trimBlocks ?? true,
          lstripBlocks: options.lstripBlocks ?? true,
        };
        configure(configOptions as ConfigureOptions);
      }
      return render(filePath, data);
    } catch (error) {
      throw new Error(`Nunjucks file rendering failed: ${String(error)}`, {
        cause: error,
      });
    }
  }
}
