export const getDocument = jest.fn(() => ({
  promise: Promise.resolve({
    numPages: 1,
    getPage: jest.fn().mockResolvedValue({
      getTextContent: jest.fn().mockResolvedValue({ items: [] }),
      getViewport: jest.fn().mockReturnValue({
        transform: [1, 0, 0, 1, 0, 0],
        height: 800,
        width: 600,
      }),
    }),
  }),
}));

export const Util = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform: jest.fn((transform, itemTransform) => [1, 0, 0, 1, 0, 0]),
};
