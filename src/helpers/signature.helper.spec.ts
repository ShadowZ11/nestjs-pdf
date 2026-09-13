import { PDFArray, PDFDocument, PDFName, PDFNumber } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { type Mocked, vi } from 'vitest';

import { NestjsPdfErrorCode, SignaturePlacementException } from '../exceptions';
import {
  __setPdfjsForTests,
  addSignatureFieldUsingAnchor,
} from './signature.helper';

const pdfjsMock = pdfjs as unknown as Mocked<typeof pdfjs>;

vi.setConfig({ testTimeout: 10000 });

describe('signature.helper', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('adds a signature field when anchor is found', async () => {
    // create a one-page PDF with size matching the pdfjs mock viewport
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([600, 800]);
    const bytes = await pdfDoc.save();

    // mock pdfjs to return a page with a matching anchor text
    const pageMock = {
      getTextContent: vi.fn().mockResolvedValue({
        items: [
          { str: '__SIG_DEBTOR_ANCHOR__', transform: [1, 0, 0, 1, 0, 0] },
        ],
      }),
      getViewport: vi.fn().mockReturnValue({
        transform: [1, 0, 0, 1, 0, 0],
        height: 800,
        width: 600,
      }),
    };

    pdfjsMock.getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn().mockResolvedValue(pageMock),
      }),
      destroy: vi.fn(),
    } as never);

    // ensure transform returns a position (e,f)
    pdfjsMock.Util.transform = vi.fn(() => [1, 0, 0, 1, 150, 100]);

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
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({ items: [] }),
          getViewport: vi.fn().mockReturnValue({
            transform: [1, 0, 0, 1, 0, 0],
            height: 800,
            width: 600,
          }),
        }),
      }),
      destroy: vi.fn(),
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

  it('reuses an existing AcroForm that has no Fields array yet', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([600, 800]);

    // Pre-register an AcroForm without a Fields entry to hit the "create Fields" branch.
    const context = pdfDoc.context;
    const acroFormDict = context.obj({ SigFlags: PDFNumber.of(3) });
    const acroFormRef = context.register(acroFormDict);
    pdfDoc.catalog.set(PDFName.of('AcroForm'), acroFormRef);

    const bytes = await pdfDoc.save();

    pdfjsMock.getDocument.mockReturnValue({
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
      destroy: vi.fn(),
    } as never);

    __setPdfjsForTests(pdfjsMock);

    const result = await addSignatureFieldUsingAnchor(bytes);
    const out = await PDFDocument.load(result);
    const fields = out.getForm().getFields();

    expect(fields.length).toBeGreaterThan(0);
  });

  it('skips text items that have no str property when scanning for the anchor', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([600, 800]);
    pdfDoc.addPage([600, 800]);
    const bytes = await pdfDoc.save();

    pdfjsMock.getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 2,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [{ transform: [1, 0, 0, 1, 0, 0] }],
          }),
          getViewport: vi.fn().mockReturnValue({
            transform: [1, 0, 0, 1, 0, 0],
            height: 800,
            width: 600,
          }),
        }),
      }),
      destroy: vi.fn(),
    } as never);

    __setPdfjsForTests(pdfjsMock);

    const result = await addSignatureFieldUsingAnchor(bytes);
    const out = await PDFDocument.load(result);
    const fields = out.getForm().getFields();

    expect(fields.length).toBeGreaterThan(0);
  });

  it('appends the widget to an existing Annots array on the target page', async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const context = pdfDoc.context;
    page.node.set(PDFName.of('Annots'), context.obj([]));
    const bytes = await pdfDoc.save();

    pdfjsMock.getDocument.mockReturnValue({
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
      destroy: vi.fn(),
    } as never);

    __setPdfjsForTests(pdfjsMock);

    const result = await addSignatureFieldUsingAnchor(bytes);
    const out = await PDFDocument.load(result);
    const outPage = out.getPages()[0];
    const annots = outPage.node.lookupMaybe(PDFName.of('Annots'), PDFArray);

    expect(annots?.size()).toBe(1);
  });

  it('throws when the anchor points to a page that does not exist', async () => {
    // The real document only has a single page (index 0), but the mocked
    // pdfjs reports the anchor on its second page (index 1), simulating a
    // mismatch between the anchor detection pass and the actual PDF.
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([600, 800]);
    const bytes = await pdfDoc.save();

    pdfjsMock.getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 2,
        getPage: vi
          .fn()
          .mockResolvedValueOnce({
            getTextContent: vi.fn().mockResolvedValue({ items: [] }),
            getViewport: vi.fn().mockReturnValue({
              transform: [1, 0, 0, 1, 0, 0],
              height: 800,
              width: 600,
            }),
          })
          .mockResolvedValueOnce({
            getTextContent: vi.fn().mockResolvedValue({
              items: [
                {
                  str: '__SIG_DEBTOR_ANCHOR__',
                  transform: [1, 0, 0, 1, 0, 0],
                },
              ],
            }),
            getViewport: vi.fn().mockReturnValue({
              transform: [1, 0, 0, 1, 0, 0],
              height: 800,
              width: 600,
            }),
          }),
      }),
      destroy: vi.fn(),
    } as never);
    pdfjsMock.Util.transform = vi.fn(() => [1, 0, 0, 1, 150, 100]);

    __setPdfjsForTests(pdfjsMock);

    let caught: unknown;
    try {
      await addSignatureFieldUsingAnchor(bytes);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(SignaturePlacementException);
    expect(caught).toMatchObject({
      message: 'Page 1 not found',
      code: NestjsPdfErrorCode.SIGNATURE_PLACEMENT_ERROR,
    });
  });

  it('throws when called outside of the test environment', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      expect(() => __setPdfjsForTests(pdfjsMock)).toThrow(
        '__setPdfjsForTests is only available in test environment',
      );
    } finally {
      process.env.NODE_ENV = original;
    }
  });
});
