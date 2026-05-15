import { Injectable } from '@nestjs/common';
import pug from 'pug';
import { readFileSync } from 'node:fs';

export type PugOptions = pug.Options;

@Injectable()
export class PugService {
  render(
    template: string,
    data: pug.LocalsObject = {},
    options?: PugOptions,
  ): string {
    try {
      const compiledFn = pug.compile(template, {
        ...options,
      });
      return compiledFn(data);
    } catch (error) {
      throw new Error(`Pug rendering failed: ${String(error)}`, {
        cause: error,
      });
    }
  }

  renderFile(
    filePath: string,
    data: pug.LocalsObject = {},
    options?: PugOptions,
  ): string {
    try {
      const template = readFileSync(filePath, 'utf-8');
      return this.render(template, data, options);
    } catch (error) {
      throw new Error(`Pug file rendering failed: ${String(error)}`, {
        cause: error,
      });
    }
  }
}
