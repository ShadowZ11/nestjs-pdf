import { readFileSync } from 'node:fs';

import { Injectable } from '@nestjs/common';
import type pug from 'pug';
import type { LocalsObject, Options } from 'pug';

import {
  EngineNotAvailableException,
  TemplateConfigurationException,
  TemplateRenderException,
} from '../../../exceptions';
import {
  resolveTemplatePath,
  TemplateDirectoryGuard,
} from '../../../helpers/template-path.helper';
import { loadEngine } from '../../libs/loadEngine.utils';
import { confineReads, type PugPlugin } from './confined-read.plugin';

export interface PugOptions extends Options {
  /** Pug plugins (not declared by `@types/pug`). */
  plugins?: Array<PugPlugin>;
  /**
   * Base directory (absolute, or relative to `process.cwd()`) for files passed to `renderFile`.
   * When set, the file is resolved from it and neither it nor its includes and
   * extends may leave it (symbolic links included); `basedir` then defaults to
   * it. Recommended when the file name can come from user input.
   */
  templateDirectory?: string;
}

@Injectable()
export class PugService {
  #pug?: typeof pug;

  get #engine(): typeof pug {
    return (this.#pug ??= loadEngine<typeof pug>('pug', 'Pug'));
  }

  render(
    template: string,
    data: LocalsObject = {},
    options?: PugOptions,
  ): string {
    return this.#render(template, data, options);
  }

  /**
   * With `file`, `template` is the content of the file at `filename`: its
   * includes and extends resolve from it (or from `basedir`, by default
   * `templateDirectory`) and may not leave `templateDirectory`.
   */
  #render(
    template: string,
    data: LocalsObject,
    options: PugOptions | undefined,
    file?: { filename: string; guard: TemplateDirectoryGuard },
  ): string {
    const engine = this.#engine;
    const { templateDirectory: _templateDirectory, ...pugOptions } =
      options ?? {};
    try {
      const compileOptions: PugOptions = file
        ? {
            ...pugOptions,
            filename: file.filename,
            basedir: pugOptions.basedir ?? file.guard.baseDir,
            plugins: confineReads(pugOptions.plugins, file.guard),
          }
        : pugOptions;
      const compiledFn = engine.compile(template, compileOptions);
      return compiledFn(data);
    } catch (error) {
      if (file?.guard.refused) {
        throw file.guard.refused;
      }
      throw new TemplateRenderException(
        'Pug',
        `Pug rendering failed: ${String(error)}`,
        { cause: error },
      );
    }
  }

  renderFile(
    filePath: string,
    data: LocalsObject = {},
    options?: PugOptions,
  ): string {
    const templatePath = resolveTemplatePath(
      'Pug',
      filePath,
      options?.templateDirectory,
    );
    try {
      const template = readFileSync(templatePath, 'utf-8');
      return this.#render(
        template,
        data,
        options,
        options?.templateDirectory === undefined
          ? undefined
          : {
              filename: templatePath,
              guard: new TemplateDirectoryGuard(
                'Pug',
                options.templateDirectory,
              ),
            },
      );
    } catch (error) {
      if (
        error instanceof EngineNotAvailableException ||
        error instanceof TemplateConfigurationException
      ) {
        throw error;
      }
      throw new TemplateRenderException(
        'Pug',
        `Pug file rendering failed: ${String(error)}`,
        { cause: error },
      );
    }
  }
}
