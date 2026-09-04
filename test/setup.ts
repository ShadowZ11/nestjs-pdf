import { afterAll, vi } from 'vitest';

vi.mock('p-limit', () => ({
  default: vi.fn(() => (fn: () => void) => fn()),
}));

afterAll(() => {
  vi.clearAllTimers();
});
