import { readFileSync } from 'node:fs';

import { Injectable } from '@nestjs/common';
import type mjml from 'mjml';
import type { MJMLParsingOptions } from 'mjml-core';

import { TemplateRenderException } from '../../../exceptions';
import {
  COMPILED_TEMPLATES_PER_SCOPE,
  LruCache,
  OptionsScopedCache,
} from '../../../helpers/template-cache.helper';
import { resolveTemplatePath } from '../../../helpers/template-path.helper';
import { loadEngine } from '../../libs/loadEngine.utils';

export interface MjmlOptions extends MJMLParsingOptions {
  /**
   * Base directory (absolute, or relative to `process.cwd()`) for files passed to `renderFile`.
   * When set, the file is resolved from it and may not leave it (symbolic links
   * included). Recommended when the file name can come from user input.
   */
  templateDirectory?: string;
}

@Injectable()
export class MjmlService {
  #mjml?: typeof mjml;
  /** MJML output depends only on the template and the options: cache the HTML. */
  readonly #scopes = new OptionsScopedCache<LruCache<string>>();

  get #engine(): typeof mjml {
    return (this.#mjml ??= loadEngine<typeof mjml>('mjml', 'MJML'));
  }

  async render(template: string, options?: MjmlOptions): Promise<string> {
    const engine = this.#engine;
    const { templateDirectory: _templateDirectory, ...mjmlOptions } =
      options ?? {};
    try {
      // The caller's object, not the stripped copy: compared by reference when it holds functions.
      const cache = this.#scopes.get(
        options,
        () => new LruCache(COMPILED_TEMPLATES_PER_SCOPE),
      );
      const cached = cache.get(template);
      if (cached !== undefined) {
        return cached;
      }
      const { html } = await engine(template, mjmlOptions);
      cache.set(template, html);
      return html;
    } catch (error) {
      throw new TemplateRenderException(
        'MJML',
        `MJML rendering failed: ${String(error)}`,
        { cause: error },
      );
    }
  }

  async renderFile(filePath: string, options?: MjmlOptions): Promise<string> {
    const templatePath = resolveTemplatePath(
      'MJML',
      filePath,
      options?.templateDirectory,
    );
    let template: string;
    try {
      template = readFileSync(templatePath, 'utf-8');
    } catch (error) {
      throw new TemplateRenderException(
        'MJML',
        `MJML file rendering failed: ${String(error)}`,
        { cause: error },
      );
    }
    return await this.render(template, options);
  }
}
