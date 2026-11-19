import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Injectable } from '@nestjs/common';
import type mjml from 'mjml';
import type { MJMLParsingOptions } from 'mjml-core';

import {
  TemplateConfigurationException,
  TemplateRenderException,
} from '../../../exceptions';
import {
  COMPILED_TEMPLATES_PER_SCOPE,
  LruCache,
  OptionsScopedCache,
} from '../../../helpers/template-cache.helper';
import {
  resolveTemplatePath,
  TemplateDirectoryGuard,
} from '../../../helpers/template-path.helper';
import { loadEngine } from '../../libs/loadEngine.utils';

export interface MjmlOptions extends MJMLParsingOptions {
  /**
   * Base directory (absolute, or relative to `process.cwd()`) for files passed to `renderFile`.
   * When set, the file is resolved from it and may not leave it (symbolic links
   * included). Its `mj-include`s (when `ignoreIncludes` is `false`) resolve from
   * the file and are confined to `includePath`, which defaults to it and must
   * lie inside it. Recommended when the file name can come from user input.
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
      // Scoped on the caller's object, not the stripped copy: options holding
      // functions are compared by reference.
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
    const templateDirectory = options?.templateDirectory;
    const templatePath = resolveTemplatePath(
      'MJML',
      filePath,
      templateDirectory,
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
    return await this.render(
      template,
      templateDirectory === undefined
        ? options
        : this.#confineIncludes(options, templateDirectory, templatePath),
    );
  }

  /**
   * MJML resolves `mj-include` from `filePath` and allows only files below it
   * or below `includePath`, symbolic links included. For a rendered string,
   * `filePath` defaults to `process.cwd()`: pin it to the rendered file and
   * keep `includePath` inside `templateDirectory`.
   */
  #confineIncludes(
    options: MjmlOptions | undefined,
    templateDirectory: string,
    templatePath: string,
  ): MjmlOptions {
    const guard = new TemplateDirectoryGuard('MJML', templateDirectory);
    const includePath =
      options?.includePath === undefined
        ? [guard.baseDir]
        : [options.includePath].flat();
    for (const path of includePath) {
      if (!guard.contains(path)) {
        throw new TemplateConfigurationException(
          `MJML file rendering failed: \`includePath\` '${path}' is outside \`templateDirectory\``,
        );
      }
    }
    return {
      ...options,
      filePath: templatePath,
      actualPath: templatePath,
      includePath: includePath.map((path) => resolve(guard.baseDir, path)),
    };
  }
}
