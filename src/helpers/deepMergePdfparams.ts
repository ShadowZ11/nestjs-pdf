import { deepmerge } from 'deepmerge-ts';

import { type PuppeteerParameters } from '../puppeteer/puppeteer-parameters.interface';

export function mergePuppeteerParameters(
  defaults: PuppeteerParameters,
  overrides?: PuppeteerParameters,
): PuppeteerParameters {
  if (!overrides) {
    return { ...defaults };
  }

  return deepmerge(defaults, overrides);
}
