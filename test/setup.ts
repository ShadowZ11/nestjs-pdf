jest.mock('p-limit', () => ({
  __esModule: true,
  default: jest.fn(() => (fn: any) => fn()),
}));

afterAll(() => {
  jest.clearAllTimers();
});
