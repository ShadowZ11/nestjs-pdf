// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
const mockPLimit = jest.fn(() => (fn: any) => fn());
export default mockPLimit;
