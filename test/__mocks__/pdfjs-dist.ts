import { vi } from 'vitest';

export const getDocument = vi.fn(() => ({
  promise: Promise.resolve({
    numPages: 1,
    getPage: vi.fn().mockResolvedValue({
      getTextContent: vi.fn().mockResolvedValue({ items: [] }),
      getViewport: vi.fn().mockReturnValue({
        transform: [1, 0, 0, 1, 0, 0],
        height: 800,
        width: 600,
      }),
    }),
  }),
}));

export const Util = {
  transform: vi.fn((_transform, _itemTransform) => [1, 0, 0, 1, 0, 0]),
};
