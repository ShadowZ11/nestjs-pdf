/** Map bounded to `maxSize` entries, evicting the least recently used one. */
export class LruCache<V> {
  readonly #entries = new Map<string, V>();
  readonly #maxSize: number;

  constructor(maxSize: number) {
    this.#maxSize = maxSize;
  }

  get size(): number {
    return this.#entries.size;
  }

  get(key: string): V | undefined {
    const value = this.#entries.get(key);
    if (value !== undefined) {
      // Re-insert to mark it as the most recently used.
      this.#entries.delete(key);
      this.#entries.set(key, value);
    }
    return value;
  }

  set(key: string, value: V): void {
    this.#entries.delete(key);
    this.#entries.set(key, value);
    if (this.#entries.size > this.#maxSize) {
      const oldest = this.#entries.keys().next().value as string;
      this.#entries.delete(oldest);
    }
  }

  getOrCreate(key: string, create: () => V): V {
    let value = this.get(key);
    if (value === undefined) {
      value = create();
      this.set(key, value);
    }
    return value;
  }

  clear(): void {
    this.#entries.clear();
  }
}

class NotPlainData extends Error {}

function toKey(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'function' || typeof value === 'symbol') {
      throw new NotPlainData();
    }
    if (typeof value === 'bigint') return `${value}n`;
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(toKey);
  }
  const proto = Object.getPrototypeOf(value) as unknown;
  if (proto !== Object.prototype && proto !== null) {
    throw new NotPlainData();
  }
  // Sorted keys: { a, b } and { b, a } are the same options.
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, toKey((value as Record<string, unknown>)[key])]),
  );
}

/**
 * A key that is equal for equal options, or `undefined` when they hold
 * functions or class instances, which cannot be compared by value.
 */
export function optionsKey(options: unknown): string | undefined {
  try {
    return JSON.stringify(toKey(options)) ?? 'undefined';
  } catch (error) {
    if (error instanceof NotPlainData) return undefined;
    throw error;
  }
}

/**
 * Holds one value (an engine instance, its compiled templates…) per set of
 * options. Options made of plain data are compared by value, so a fresh
 * per-call object with the same content reuses the same value; options holding
 * functions are compared by reference.
 */
export class OptionsScopedCache<V> {
  readonly #byValue: LruCache<V>;
  #byReference = new WeakMap<object, V>();

  constructor(maxScopes = 20) {
    this.#byValue = new LruCache<V>(maxScopes);
  }

  get(options: object | undefined, create: () => V): V {
    const key = optionsKey(options);
    if (key !== undefined) {
      return this.#byValue.getOrCreate(key, create);
    }

    const scope = options as object;
    let value = this.#byReference.get(scope);
    if (value === undefined) {
      value = create();
      this.#byReference.set(scope, value);
    }
    return value;
  }

  clear(): void {
    this.#byValue.clear();
    this.#byReference = new WeakMap();
  }
}

export const COMPILED_TEMPLATES_PER_SCOPE = 100;
