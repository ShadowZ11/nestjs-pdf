import { Injectable } from '@nestjs/common';
import ejs, { type Data, type Options } from 'ejs';

import { TemplateRenderException } from '../../../exceptions';

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
      throw new TemplateRenderException(
        'EJS',
        `EJS rendering failed: ${String(error)}`,
        { cause: error },
      );
    }
  }

  async renderFile(filePath: string, data: Data = {}, options?: EjsOptions) {
    try {
      return await ejs.renderFile(filePath, data, {
        async: true,
        ...options,
      });
    } catch (error) {
      throw new TemplateRenderException(
        'EJS',
        `EJS file rendering failed: ${String(error)}`,
        { cause: error },
      );
    }
  }
}
