jest.mock('p-limit', () => ({
  __esModule: true,
  default: jest.fn(() => (fn: () => void) => fn()),
}));

afterAll(() => {
  jest.clearAllTimers();
});
