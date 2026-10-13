import { createRequire } from 'node:module';

import { EngineNotAvailableException } from '../../exceptions';

const requireEngine = createRequire(import.meta.url);

/**
 * Load an optional template engine on first use, so the library can be imported
 * without every engine installed. `require` (not `import()`) is used on purpose:
 * most engines expose a synchronous render API.
 */
export function loadEngine<T>(packageName: string, engineName: string): T {
  let mod: { __esModule?: boolean; default?: unknown };
  try {
    mod = requireEngine(packageName) as typeof mod;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
      throw new EngineNotAvailableException(engineName, packageName, {
        cause: error,
      });
    }
    throw error;
  }

  return (mod.__esModule && 'default' in mod ? mod.default : mod) as T;
}
