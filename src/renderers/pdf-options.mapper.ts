import type { PDFOptions } from 'puppeteer';

import { RendererConfigurationException } from '../exceptions';

/** Paper sizes in inches, as Puppeteer defines them. */
const PAPER_FORMATS: Record<string, { width: number; height: number }> = {
  letter: { width: 8.5, height: 11 },
  legal: { width: 8.5, height: 14 },
  tabloid: { width: 11, height: 17 },
  ledger: { width: 17, height: 11 },
  a0: { width: 33.1102, height: 46.811 },
  a1: { width: 23.3858, height: 33.1102 },
  a2: { width: 16.5354, height: 23.3858 },
  a3: { width: 11.6929, height: 16.5354 },
  a4: { width: 8.2677, height: 11.6929 },
  a5: { width: 5.8268, height: 8.2677 },
  a6: { width: 4.1339, height: 5.8268 },
};

const INCHES_PER_UNIT: Record<string, number> = {
  px: 1 / 96,
  in: 1,
  cm: 1 / 2.54,
  mm: 1 / 25.4,
};

/**
 * Converts a Puppeteer length (a number of pixels, or a string with a
 * `px`/`in`/`cm`/`mm` unit) to inches.
 */
export function toInches(value: string | number): number {
  if (typeof value === 'number') {
    return value * INCHES_PER_UNIT.px;
  }

  const match = /^\s*(-?\d*\.?\d+)\s*(px|in|cm|mm)?\s*$/i.exec(value);
  if (!match) {
    throw new RendererConfigurationException(
      `Invalid length '${value}': expected a number of pixels or a value in px, in, cm or mm`,
    );
  }

  const unit = (match[2] ?? 'px').toLowerCase();
  return Number(match[1]) * INCHES_PER_UNIT[unit];
}

function formatInches(inches: number): string {
  return String(Math.round(inches * 10_000) / 10_000);
}

export interface PrintLayout {
  /** Paper width, in inches. */
  width: number;
  /** Paper height, in inches. */
  height: number;
  margin: { top?: number; right?: number; bottom?: number; left?: number };
}

export function resolvePrintLayout(pdfOptions: PDFOptions): PrintLayout {
  let width: number;
  let height: number;

  if (pdfOptions.width !== undefined || pdfOptions.height !== undefined) {
    const fallback = PAPER_FORMATS.letter;
    width =
      pdfOptions.width === undefined
        ? fallback.width
        : toInches(pdfOptions.width);
    height =
      pdfOptions.height === undefined
        ? fallback.height
        : toInches(pdfOptions.height);
  } else {
    const formatName = (pdfOptions.format ?? 'letter').toLowerCase();
    const format = PAPER_FORMATS[formatName];
    if (!format) {
      throw new RendererConfigurationException(
        `Unknown paper format '${pdfOptions.format}'`,
      );
    }
    ({ width, height } = format);
  }

  const margin: PrintLayout['margin'] = {};
  for (const side of ['top', 'right', 'bottom', 'left'] as const) {
    const value = pdfOptions.margin?.[side];
    if (value !== undefined) {
      margin[side] = toInches(value);
    }
  }

  return { width, height, margin };
}

function toHtmlDocument(template: string): string {
  return /<html[\s>]/i.test(template)
    ? template
    : `<!DOCTYPE html><html><head></head><body>${template}</body></html>`;
}

export interface GotenbergForm {
  fields: Record<string, string>;
  /** Extra files, by form name (`header.html`, `footer.html`). */
  files: Record<string, string>;
}

export function toGotenbergForm(pdfOptions: PDFOptions): GotenbergForm {
  const { width, height, margin } = resolvePrintLayout(pdfOptions);

  const fields: Record<string, string> = {
    paperWidth: formatInches(width),
    paperHeight: formatInches(height),
    // Puppeteer's default margin is 0, Gotenberg's is 0.39in.
    marginTop: formatInches(margin.top ?? 0),
    marginRight: formatInches(margin.right ?? 0),
    marginBottom: formatInches(margin.bottom ?? 0),
    marginLeft: formatInches(margin.left ?? 0),
    // Same rendering as the Puppeteer provider: screen media, wait for the network.
    emulatedMediaType: 'screen',
    skipNetworkIdleEvent: 'false',
  };

  if (pdfOptions.landscape !== undefined) {
    fields.landscape = String(pdfOptions.landscape);
  }
  if (pdfOptions.printBackground !== undefined) {
    fields.printBackground = String(pdfOptions.printBackground);
  }
  if (pdfOptions.omitBackground !== undefined) {
    fields.omitBackground = String(pdfOptions.omitBackground);
  }
  if (pdfOptions.scale !== undefined) fields.scale = String(pdfOptions.scale);
  if (pdfOptions.pageRanges) fields.nativePageRanges = pdfOptions.pageRanges;
  if (pdfOptions.preferCSSPageSize !== undefined) {
    fields.preferCssPageSize = String(pdfOptions.preferCSSPageSize);
  }
  if (pdfOptions.tagged !== undefined) {
    fields.generateTaggedPdf = String(pdfOptions.tagged);
  }
  if (pdfOptions.outline !== undefined) {
    fields.generateDocumentOutline = String(pdfOptions.outline);
  }

  const files: Record<string, string> = {};
  if (pdfOptions.displayHeaderFooter) {
    if (pdfOptions.headerTemplate) {
      files['header.html'] = toHtmlDocument(pdfOptions.headerTemplate);
    }
    if (pdfOptions.footerTemplate) {
      files['footer.html'] = toHtmlDocument(pdfOptions.footerTemplate);
    }
  }

  return { fields, files };
}

export function toApi2PdfOptions(
  pdfOptions: PDFOptions,
): Record<string, unknown> {
  const { width, height, margin } = resolvePrintLayout(pdfOptions);

  const options: Record<string, unknown> = {
    width: `${formatInches(width)}in`,
    height: `${formatInches(height)}in`,
    marginTop: `${formatInches(margin.top ?? 0)}in`,
    marginRight: `${formatInches(margin.right ?? 0)}in`,
    marginBottom: `${formatInches(margin.bottom ?? 0)}in`,
    marginLeft: `${formatInches(margin.left ?? 0)}in`,
    // Same rendering as the Puppeteer provider: screen media.
    usePrintCss: false,
  };

  const passthrough = [
    'landscape',
    'printBackground',
    'omitBackground',
    'scale',
    'pageRanges',
    'displayHeaderFooter',
    'headerTemplate',
    'footerTemplate',
  ] as const;
  for (const key of passthrough) {
    if (pdfOptions[key] !== undefined) {
      options[key] = pdfOptions[key];
    }
  }

  return options;
}
