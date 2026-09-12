import { PDFDocument } from 'pdf-lib';
import { vi } from 'vitest';

describe('signature.helper loadPdfjs failure', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doUnmock('pdfjs-dist/legacy/build/pdf.mjs');
  });

  it('wraps the error when the dynamic import of pdfjs-dist fails', async () => {
    vi.doMock('pdfjs-dist/legacy/build/pdf.mjs', () => {
      throw new Error('module not found');
    });

    const { addSignatureFieldUsingAnchor } = await import('./signature.helper');

    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([600, 800]);
    const bytes = await pdfDoc.save();

    await expect(addSignatureFieldUsingAnchor(bytes)).rejects.toThrow(
      /Failed to load pdfjs-dist\./,
    );
  });
});
