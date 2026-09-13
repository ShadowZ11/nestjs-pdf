import { PDFDocument } from 'pdf-lib';
import { vi } from 'vitest';

import { NestjsPdfErrorCode } from '../exceptions';

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

    let caught: unknown;
    try {
      await addSignatureFieldUsingAnchor(bytes);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(Error);
    const depError = caught as Error & {
      code: NestjsPdfErrorCode;
      cause: unknown;
    };
    expect(depError.name).toBe('SignatureDependencyException');
    expect(depError.code).toBe(NestjsPdfErrorCode.SIGNATURE_DEPENDENCY_ERROR);
    expect(depError.cause).toBeInstanceOf(Error);
  });
});
