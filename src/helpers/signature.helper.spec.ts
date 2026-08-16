import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

import {
  __setPdfjsForTests,
  addSignatureFieldUsingAnchor,
} from './signature.helper';

const pdfjsMock = pdfjs as unknown as jest.Mocked<typeof pdfjs>;

jest.setTimeout(10000);

describe('signature.helper', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('adds a signature field when anchor is found', async () => {
    // create a one-page PDF with size matching the pdfjs mock viewport
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([600, 800]);
    const bytes = await pdfDoc.save();

    // mock pdfjs to return a page with a matching anchor text
    const pageMock = {
      getTextContent: jest.fn().mockResolvedValue({
        items: [
          { str: '__SIG_DEBTOR_ANCHOR__', transform: [1, 0, 0, 1, 0, 0] },
        ],
      }),
      getViewport: jest.fn().mockReturnValue({
        transform: [1, 0, 0, 1, 0, 0],
        height: 800,
        width: 600,
      }),
    };

    pdfjsMock.getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: jest.fn().mockResolvedValue(pageMock),
      }),
      destroy: jest.fn(),
    } as never);

    // ensure transform returns a position (e,f)
    pdfjsMock.Util.transform = jest.fn(() => [1, 0, 0, 1, 150, 100]);

    // inject mocked pdfjs to avoid dynamic import at runtime
    __setPdfjsForTests(pdfjsMock);

    const result = await addSignatureFieldUsingAnchor(bytes);

    const out = await PDFDocument.load(result);
    const form = out.getForm();
    const fields = form.getFields();

    expect(fields.length).toBeGreaterThan(0);
    const names = fields.map((f) => f.getName());
    expect(names).toContain('SignatureDebtor');
  });

  it('adds a signature field to last page when no anchor', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([600, 800]);
    pdfDoc.addPage([600, 800]);
    const bytes = await pdfDoc.save();

    // default mock returns no items (see test/__mocks__/pdfjs-dist.ts)
    pdfjsMock.getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 2,
        getPage: jest.fn().mockResolvedValue({
          getTextContent: jest.fn().mockResolvedValue({ items: [] }),
          getViewport: jest.fn().mockReturnValue({
            transform: [1, 0, 0, 1, 0, 0],
            height: 800,
            width: 600,
          }),
        }),
      }),
      destroy: jest.fn(),
    } as never);

    // inject mocked pdfjs to avoid dynamic import at runtime
    __setPdfjsForTests(pdfjsMock);

    const result = await addSignatureFieldUsingAnchor(bytes);
    const out = await PDFDocument.load(result);
    const form = out.getForm();
    const fields = form.getFields();

    expect(fields.length).toBeGreaterThan(0);
    const names = fields.map((f) => f.getName());
    expect(names).toContain('SignatureDebtor');
  });
});
