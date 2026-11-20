import { deepmerge, deepmergeCustom } from 'deepmerge-ts';

import { type PuppeteerParameters } from '../puppeteer/puppeteer-parameters.interface';

/** Per-call arrays replace the module ones instead of being appended to them. */
const deepmergeReplacingArrays = deepmergeCustom({ mergeArrays: false });

export function mergePuppeteerParameters(
  defaults: PuppeteerParameters,
  overrides?: PuppeteerParameters,
): PuppeteerParameters {
  if (!overrides) {
    return { ...defaults };
  }

  const arrayMerge = overrides.arrayMerge ?? defaults.arrayMerge ?? 'concat';

  if (arrayMerge === 'replace') {
    return deepmergeReplacingArrays(defaults, overrides);
  }

  return deepmerge(defaults, overrides);
}
