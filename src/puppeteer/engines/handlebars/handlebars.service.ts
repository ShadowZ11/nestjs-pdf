import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

import { Injectable } from '@nestjs/common';
import Handlebars from 'handlebars';

export type HandlebarsHelper = {
  name: string;
  fn: Handlebars.HelperDelegate;
};

export interface HandlebarsOptions {
  /** Base directory (relative to `process.cwd()`) used to resolve files passed to `renderFile`. */
  templateDirectory?: string;
  /** Directory (relative to `process.cwd()`) whose files are each registered as a partial. */
  partialDirectory?: string;
  /**
   * Runtime options forwarded to the compiled template function.
   * `helpers` and `partials` are excluded on purpose: register helpers via
   * `helpers` and partials via `partialDirectory`.
   */
  templateOptions?: Omit<Handlebars.RuntimeOptions, 'helpers' | 'partials'>;
  /** Options forwarded to `Handlebars.compile`. */
  compileOptions?: CompileOptions;
  /** Custom helpers registered on the isolated Handlebars environment for this render. */
  helpers?: Array<HandlebarsHelper>;
}

@Injectable()
export class HandlebarsService {
  private cachedOptions?: HandlebarsOptions;
  private cachedEnv?: typeof Handlebars;

  render(
    template: string,
    parameters: unknown = {},
    options: HandlebarsOptions = {},
  ): string {
    try {
      const compiled = this.getEnv(options).compile(
        template,
        options.compileOptions,
      );
      return compiled(parameters, options.templateOptions);
    } catch (error) {
      throw new Error(`Handlebars rendering failed: ${String(error)}`, {
        cause: error,
      });
    }
  }

  renderFile(
    file: string,
    parameters: unknown = {},
    options: HandlebarsOptions = {},
  ): string {
    if (options.templateDirectory === undefined) {
      throw new Error(
        'Handlebars file rendering failed: option `templateDirectory` is not set',
      );
    }

    let template: string;
    try {
      template = readFileSync(
        join(process.cwd(), options.templateDirectory, file),
        'utf8',
      );
    } catch (error) {
      throw new Error(`Handlebars file rendering failed: ${String(error)}`, {
        cause: error,
      });
    }

    return this.render(template, parameters, options);
  }

  /**
   * Build an isolated Handlebars environment with the given helpers/partials so
   * nothing leaks into the global Handlebars. Memoised for the common case where
   * the same options object is reused across calls (e.g. the module `hbsOptions`).
   */
  private getEnv(options: HandlebarsOptions): typeof Handlebars {
    if (this.cachedEnv && this.cachedOptions === options) {
      return this.cachedEnv;
    }

    const env = Handlebars.create();

    for (const helper of options.helpers ?? []) {
      env.registerHelper(helper.name, helper.fn);
    }
    this.registerPartials(env, options.partialDirectory);

    this.cachedOptions = options;
    this.cachedEnv = env;
    return env;
  }

  private registerPartials(
    env: typeof Handlebars,
    partialDirectory: string | undefined,
  ): void {
    if (partialDirectory === undefined) return;

    const partialPath = join(process.cwd(), partialDirectory);
    if (!existsSync(partialPath)) {
      throw new Error(
        `Handlebars partial directory does not exist: ${partialPath}`,
      );
    }

    for (const entry of readdirSync(partialPath)) {
      const filePath = join(partialPath, entry);
      if (!statSync(filePath).isFile()) continue;

      env.registerPartial(
        basename(entry, extname(entry)),
        readFileSync(filePath, 'utf8'),
      );
    }
  }
}
