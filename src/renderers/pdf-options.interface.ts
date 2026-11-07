// Mirrors of Puppeteer's public types. puppeteer is an optional peer: the
// published declarations must not import it, or remote-only installs lose
// their typings (or fail to compile without `skipLibCheck`).
// pdf-options.interface.spec.ts keeps them in sync with Puppeteer.

type LowerCasePaperFormat =
  | 'letter'
  | 'legal'
  | 'tabloid'
  | 'ledger'
  | 'a0'
  | 'a1'
  | 'a2'
  | 'a3'
  | 'a4'
  | 'a5'
  | 'a6';

/** Paper format, as Puppeteer's `PaperFormat`. */
export type PdfPaperFormat =
  | Uppercase<LowerCasePaperFormat>
  | Capitalize<LowerCasePaperFormat>
  | LowerCasePaperFormat;

/** Page margins: a number of pixels, or a string with a px/in/cm/mm unit. */
export interface PdfMargin {
  top?: string | number;
  bottom?: string | number;
  left?: string | number;
  right?: string | number;
}

/**
 * Page options, same shape as Puppeteer's `PDFOptions`. Remote providers
 * translate the size, margins, orientation, backgrounds, scale, page ranges
 * and header/footer templates; `path`, `timeout` and `waitForFonts` are
 * Puppeteer only.
 */
export interface PdfOptions {
  scale?: number;
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  printBackground?: boolean;
  landscape?: boolean;
  pageRanges?: string;
  format?: PdfPaperFormat;
  width?: string | number;
  height?: string | number;
  preferCSSPageSize?: boolean;
  margin?: PdfMargin;
  path?: string;
  omitBackground?: boolean;
  tagged?: boolean;
  outline?: boolean;
  timeout?: number;
  waitForFonts?: boolean;
}

/** Browser to install, as the `Browser` enum of `@puppeteer/browsers` (its values are accepted). */
export type PdfBrowser =
  'chrome' | 'chrome-headless-shell' | 'chromium' | 'firefox' | 'chromedriver';
