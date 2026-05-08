export const getDocument = jest.fn(() => ({
  promise: Promise.resolve({
    numPages: 1,
    getPage: jest.fn().mockResolvedValue({
      getTextContent: jest.fn().mockResolvedValue({
        items: [],
      }),
    }),
  }),
}));
