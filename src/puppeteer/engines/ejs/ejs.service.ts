import { Injectable } from '@nestjs/common';
import ejs, { type Data, type Options } from 'ejs';

export interface EjsOptions extends Omit<Options, 'async'> {
  async?: boolean;
}

@Injectable()
export class EjsService {
  async render(template: string, data: Data = {}, options?: EjsOptions) {
    try {
      return await ejs.render(template, data, {
        async: true,
        ...options,
      });
    } catch (error) {
      throw new Error(`EJS rendering failed: ${String(error)}`, {
        cause: error,
      });
    }
  }

  async renderFile(filePath: string, data: Data = {}, options?: EjsOptions) {
    try {
      return await ejs.renderFile(filePath, data, {
        async: true,
        ...options,
      });
    } catch (error) {
      throw new Error(`EJS file rendering failed: ${String(error)}`, {
        cause: error,
      });
    }
  }
}
