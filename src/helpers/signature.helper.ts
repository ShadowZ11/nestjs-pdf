import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFString,
} from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { TextItem } from 'pdfjs-dist/types/src/display/api';

function toU8(input: Uint8Array | Buffer): Uint8Array {
  return input instanceof Uint8Array ? input : new Uint8Array(input);
}

async function findAnchorPosition(
  pdfBytes: Uint8Array,
  anchorText: string,
): Promise<null | {
  pageIndex: number;
  x: number;
  y: number;
  pageWidth: number;
  pageHeight: number;
}> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    for (const itemRaw of textContent.items) {
      const item = itemRaw as TextItem;
      const str = item.str;
      if (!str?.includes(anchorText)) continue;

      const t = pdfjsLib.Util.transform(viewport.transform, item.transform);
      const [_a, _b, _c, _d, e, f] = t as number[];

      const x = e;
      const y = viewport.height - f;

      return {
        pageIndex: pageNum - 1,
        x,
        y,
        pageWidth: viewport.width,
        pageHeight: viewport.height,
      };
    }
  }

  return null;
}

function addSignatureFieldAt(
  pdfDoc: PDFDocument,
  pageIndex: number,
  opts: {
    fieldName: string;
    x: number;
    y: number;
    width: number;
    height: number;
  },
) {
  const { fieldName, x, y, width, height } = opts;
  const context = pdfDoc.context;

  const page = pdfDoc.getPages()[pageIndex];
  if (!page) throw new Error(`Page ${pageIndex} not found`);

  const rectArray = context.obj([
    PDFNumber.of(x),
    PDFNumber.of(y),
    PDFNumber.of(x + width),
    PDFNumber.of(y + height),
  ]);

  const widgetDict = context.obj({
    Type: PDFName.of('Annot'),
    Subtype: PDFName.of('Widget'),
    Rect: rectArray,
    F: PDFNumber.of(4),
    P: page.ref,
  });
  const widgetRef = context.register(widgetDict);

  const fieldDict = context.obj({
    FT: PDFName.of('Sig'),
    T: PDFString.of(fieldName),
    Ff: PDFNumber.of(0),
    Kids: context.obj([widgetRef]),
  });
  const fieldRef = context.register(fieldDict);

  widgetDict.set(PDFName.of('Parent'), fieldRef);

  let annots = page.node.lookupMaybe(PDFName.of('Annots'), PDFArray);
  if (!annots) {
    annots = context.obj([]);
    page.node.set(PDFName.of('Annots'), annots);
  }
  annots.push(widgetRef);

  let acroForm = pdfDoc.catalog.lookupMaybe(PDFName.of('AcroForm'), PDFDict);
  if (!acroForm) {
    acroForm = context.obj({
      Fields: context.obj([]),
      SigFlags: PDFNumber.of(3),
    });
    const acroFormRef = context.register(acroForm);
    pdfDoc.catalog.set(PDFName.of('AcroForm'), acroFormRef);
  }

  let fields = acroForm.lookupMaybe(PDFName.of('Fields'), PDFArray);
  if (!fields) {
    fields = context.obj([]);
    acroForm.set(PDFName.of('Fields'), fields);
  }
  fields.push(fieldRef);

  return { fieldRef, widgetRef };
}

export async function addSignatureFieldUsingAnchor(
  pdf: Uint8Array | Buffer,
  fieldName = 'SignatureDebtor',
  anchorText = '__SIG_DEBTOR_ANCHOR__',
) {
  const bytes = toU8(pdf);

  const anchor = await findAnchorPosition(bytes.slice(), anchorText);

  const pdfDoc = await PDFDocument.load(bytes);

  const sigWidth = 240;
  const sigHeight = 50;

  if (anchor) {
    const pageIndex = anchor.pageIndex;
    const page = pdfDoc.getPages()[pageIndex];
    const { width: pw, height: ph } = page.getSize();

    const padX = 40;
    const padY = 7;
    let x = anchor.x - sigWidth / 2 + padX;

    let y = anchor.y - sigHeight + padY;

    const margin = 10;

    x = Math.max(margin, Math.min(x, pw - sigWidth - margin));
    y = Math.max(margin, Math.min(y, ph - sigHeight - margin));

    addSignatureFieldAt(pdfDoc, anchor.pageIndex, {
      fieldName,
      x,
      y,
      width: sigWidth,
      height: sigHeight,
    });
  } else {
    const pages = pdfDoc.getPages();
    const pageIndex = pages.length - 1;
    const page = pages[pageIndex];
    const { width: pageWidth } = page.getSize();
    const x = (pageWidth - sigWidth) / 2;
    const y = 90;

    addSignatureFieldAt(pdfDoc, pageIndex, {
      fieldName,
      x,
      y,
      width: sigWidth,
      height: sigHeight,
    });
  }

  return await pdfDoc.save();
}
