import {
  degrees,
  PDFDocument,
  type PDFImage,
  type PDFPage,
  rgb,
  StandardFonts,
} from 'pdf-lib';

import { WatermarkException } from '../exceptions';

export interface WatermarkOptions {
  /** Text to stamp. At least one of `text` or `image` is required. */
  text?: string;
  /** PNG or JPEG bytes to stamp. At least one of `text` or `image` is required. */
  image?: Uint8Array | Buffer;
  /** Opacity between 0 (invisible) and 1 (opaque). Default: 0.15 */
  opacity?: number;
  /** Counter-clockwise rotation in degrees. Default: 45 */
  rotation?: number;
  /** Text font size in points. Default: 60 */
  fontSize?: number;
  /** One of the PDF standard fonts (WinAnsi characters only). Default: 'HelveticaBold' */
  font?: keyof typeof StandardFonts;
  /** Text color as `#rgb` or `#rrggbb`. Default: '#808080' */
  color?: string;
  /** Rendered image width in points (aspect ratio preserved). Default: 50% of the page width */
  imageWidth?: number;
  /** `center` stamps once per page, `tile` repeats the mark across the page. Default: 'center' */
  position?: 'center' | 'tile';
  /** Gap in points between two marks when `position` is `tile`. Default: 100 */
  tileSpacing?: number;
  /** 1-based page numbers to watermark. Default: all pages */
  pages?: Array<number>;
}

const DEFAULT_OPACITY = 0.15;
const DEFAULT_ROTATION = 45;
const DEFAULT_FONT_SIZE = 60;
const DEFAULT_FONT: keyof typeof StandardFonts = 'HelveticaBold';
const DEFAULT_COLOR = '#808080';
const DEFAULT_TILE_SPACING = 100;

interface Mark {
  width: number;
  height: number;
  draw: (page: PDFPage, x: number, y: number) => void;
}

function parseHexColor(color: string) {
  const match = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(color);
  if (!match) {
    throw new WatermarkException(
      `Invalid watermark color "${color}", expected #rgb or #rrggbb`,
    );
  }
  const hex =
    match[1].length === 3 ? [...match[1]].map((c) => c + c).join('') : match[1];
  const channel = (i: number) => Number.parseInt(hex.slice(i, i + 2), 16) / 255;
  return rgb(channel(0), channel(2), channel(4));
}

function embedImage(pdfDoc: PDFDocument, bytes: Uint8Array): Promise<PDFImage> {
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e;
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
  if (isPng) return pdfDoc.embedPng(bytes);
  if (isJpeg) return pdfDoc.embedJpg(bytes);
  throw new WatermarkException('Watermark image must be a PNG or JPEG');
}

function validate(options: WatermarkOptions) {
  const { text, image, opacity, fontSize, imageWidth, tileSpacing } = options;
  if (!text && !image) {
    throw new WatermarkException(
      'A watermark requires at least a `text` or an `image`',
    );
  }
  if (opacity !== undefined && !(opacity >= 0 && opacity <= 1)) {
    throw new WatermarkException('Watermark `opacity` must be between 0 and 1');
  }
  if (fontSize !== undefined && !(fontSize > 0)) {
    throw new WatermarkException('Watermark `fontSize` must be greater than 0');
  }
  if (imageWidth !== undefined && !(imageWidth > 0)) {
    throw new WatermarkException(
      'Watermark `imageWidth` must be greater than 0',
    );
  }
  if (tileSpacing !== undefined && !(tileSpacing >= 0)) {
    throw new WatermarkException('Watermark `tileSpacing` must be at least 0');
  }
}

function resolvePageIndexes(pages: Array<number> | undefined, total: number) {
  if (!pages) {
    return Array.from({ length: total }, (_, i) => i);
  }
  for (const page of pages) {
    if (!Number.isInteger(page) || page < 1 || page > total) {
      throw new WatermarkException(
        `Watermark page ${page} is out of range (the PDF has ${total} page(s))`,
      );
    }
  }
  return [...new Set(pages)].map((page) => page - 1);
}

/**
 * Centers of the marks for one page, in page coordinates. Tiles follow the
 * rotated axes so rotated marks never overlap each other.
 */
function markCenters(
  pageWidth: number,
  pageHeight: number,
  mark: Mark,
  options: { position: 'center' | 'tile'; rotation: number; spacing: number },
) {
  const cx = pageWidth / 2;
  const cy = pageHeight / 2;
  if (options.position === 'center') {
    return [{ x: cx, y: cy }];
  }

  const theta = (options.rotation * Math.PI) / 180;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const stepX = mark.width + options.spacing;
  const stepY = mark.height + options.spacing;
  const reach = Math.hypot(mark.width, mark.height) / 2;
  const n = Math.ceil(
    (Math.hypot(pageWidth, pageHeight) / 2 + reach) / Math.min(stepX, stepY),
  );

  const centers: Array<{ x: number; y: number }> = [];
  for (let i = -n; i <= n; i++) {
    for (let j = -n; j <= n; j++) {
      const x = cx + i * stepX * cos - j * stepY * sin;
      const y = cy + i * stepX * sin + j * stepY * cos;
      if (
        x >= -reach &&
        x <= pageWidth + reach &&
        y >= -reach &&
        y <= pageHeight + reach
      ) {
        centers.push({ x, y });
      }
    }
  }
  return centers;
}

async function buildMark(
  pdfDoc: PDFDocument,
  options: WatermarkOptions,
  pageWidth: number,
): Promise<Mark> {
  const opacity = options.opacity ?? DEFAULT_OPACITY;
  const rotate = degrees(options.rotation ?? DEFAULT_ROTATION);

  if (options.image) {
    const image = await embedImage(pdfDoc, new Uint8Array(options.image));
    const width = options.imageWidth ?? pageWidth / 2;
    const height = (image.height / image.width) * width;
    return {
      width,
      height,
      draw: (page, x, y) =>
        page.drawImage(image, { x, y, width, height, opacity, rotate }),
    };
  }

  const font = await pdfDoc.embedFont(
    StandardFonts[options.font ?? DEFAULT_FONT],
  );
  const size = options.fontSize ?? DEFAULT_FONT_SIZE;
  const text = options.text!;
  const color = parseHexColor(options.color ?? DEFAULT_COLOR);
  let width: number;
  try {
    width = font.widthOfTextAtSize(text, size);
  } catch (error) {
    throw new WatermarkException(
      `Watermark text cannot be rendered with the ${options.font ?? DEFAULT_FONT} font (only WinAnsi characters are supported)`,
      { cause: error },
    );
  }
  return {
    width,
    height: font.heightAtSize(size, { descender: false }),
    draw: (page, x, y) =>
      page.drawText(text, { x, y, size, font, color, opacity, rotate }),
  };
}

/**
 * Stamps a text or image watermark on the pages of an existing PDF.
 */
export async function addWatermark(
  pdf: Uint8Array | Buffer,
  options: WatermarkOptions,
): Promise<Uint8Array> {
  validate(options);

  try {
    const pdfDoc = await PDFDocument.load(new Uint8Array(pdf));
    const pages = pdfDoc.getPages();
    const indexes = resolvePageIndexes(options.pages, pages.length);

    const position = options.position ?? 'center';
    const rotation = options.rotation ?? DEFAULT_ROTATION;
    const spacing = options.tileSpacing ?? DEFAULT_TILE_SPACING;
    const theta = (rotation * Math.PI) / 180;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);

    // The image width depends on the page width, so marks are cached per width.
    const marks = new Map<number, Mark>();

    for (const index of indexes) {
      const page = pages[index];
      const { width: pageWidth, height: pageHeight } = page.getSize();

      let mark = marks.get(pageWidth);
      if (!mark) {
        mark = await buildMark(pdfDoc, options, pageWidth);
        marks.set(pageWidth, mark);
      }

      for (const center of markCenters(pageWidth, pageHeight, mark, {
        position,
        rotation,
        spacing,
      })) {
        // drawText/drawImage rotate around the bottom-left corner, so shift
        // the origin to make the mark's own center land on `center`.
        mark.draw(
          page,
          center.x - ((mark.width / 2) * cos - (mark.height / 2) * sin),
          center.y - ((mark.width / 2) * sin + (mark.height / 2) * cos),
        );
      }
    }

    return await pdfDoc.save();
  } catch (error) {
    if (error instanceof WatermarkException) throw error;
    throw new WatermarkException(
      `Failed to add watermark: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}
