import {
  LruCache,
  optionsKey,
  OptionsScopedCache,
} from './template-cache.helper';

describe('LruCache', () => {
  it('should evict the least recently used entry', () => {
    const cache = new LruCache<number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a'); // `b` is now the least recently used
    cache.set('c', 3);

    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBe(3);
    expect(cache.size).toBe(2);
  });

  it('should create a value only on a miss', () => {
    const cache = new LruCache<object>(10);
    const create = vi.fn(() => ({}));

    const first = cache.getOrCreate('k', create);
    const second = cache.getOrCreate('k', create);

    expect(first).toBe(second);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('should overwrite an existing key without growing', () => {
    const cache = new LruCache<number>(2);
    cache.set('a', 1);
    cache.set('a', 2);

    expect(cache.get('a')).toBe(2);
    expect(cache.size).toBe(1);
  });

  it('should clear every entry', () => {
    const cache = new LruCache<number>(2);
    cache.set('a', 1);
    cache.clear();

    expect(cache.size).toBe(0);
  });
});

describe('optionsKey', () => {
  it('should ignore key order', () => {
    expect(optionsKey({ a: 1, b: { c: 2, d: 3 } })).toBe(
      optionsKey({ b: { d: 3, c: 2 }, a: 1 }),
    );
  });

  it('should tell different options apart', () => {
    expect(optionsKey({ a: 1 })).not.toBe(optionsKey({ a: 2 }));
    expect(optionsKey({ a: [1, 2] })).not.toBe(optionsKey({ a: [2, 1] }));
    expect(optionsKey({ a: 1n })).not.toBe(optionsKey({ a: '1' }));
  });

  it('should key undefined options', () => {
    expect(optionsKey(undefined)).toBe('undefined');
  });

  it('should rethrow unexpected errors', () => {
    const boom = new Error('boom');
    const options = {
      get a() {
        throw boom;
      },
    };
    expect(() => optionsKey(options)).toThrow(boom);
  });

  it.each([
    ['a function', { fn: () => undefined }],
    ['a nested function', { helpers: [{ fn: () => undefined }] }],
    ['a class instance', { pattern: /x/ }],
    ['a symbol', { s: Symbol('x') }],
    ['a Date', { at: new Date() }],
  ])('should refuse options holding %s', (_label, options) => {
    expect(optionsKey(options)).toBeUndefined();
  });
});

describe('OptionsScopedCache', () => {
  it('should share a value between equal plain options', () => {
    const cache = new OptionsScopedCache<object>();
    const create = vi.fn(() => ({}));

    const first = cache.get({ a: 1 }, create);
    const second = cache.get({ a: 1 }, create);

    expect(first).toBe(second);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('should compare options holding functions by reference', () => {
    const cache = new OptionsScopedCache<object>();
    const fn = () => undefined;
    const options = { fn };
    const create = vi.fn(() => ({}));

    const first = cache.get(options, create);
    const same = cache.get(options, create);
    const equalButOther = cache.get({ fn }, create);

    expect(same).toBe(first);
    expect(equalButOther).not.toBe(first);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('should bound the number of plain-option scopes', () => {
    const cache = new OptionsScopedCache<object>(2);
    const create = vi.fn(() => ({}));

    const first = cache.get({ n: 1 }, create);
    cache.get({ n: 2 }, create);
    cache.get({ n: 3 }, create);

    expect(cache.get({ n: 1 }, create)).not.toBe(first);
    expect(create).toHaveBeenCalledTimes(4);
  });

  it('should forget every scope on clear', () => {
    const cache = new OptionsScopedCache<object>();
    const fn = () => undefined;
    const options = { fn };
    const first = cache.get(options, () => ({}));
    const firstPlain = cache.get({ a: 1 }, () => ({}));

    cache.clear();

    expect(cache.get(options, () => ({}))).not.toBe(first);
    expect(cache.get({ a: 1 }, () => ({}))).not.toBe(firstPlain);
  });
});
