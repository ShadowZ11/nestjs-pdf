/** Renders the PDF with a local Chromium driven by Puppeteer (default). */
export interface PuppeteerProviderOptions {
  type: 'puppeteer';
}

/** Renders the PDF on a Gotenberg server (https://gotenberg.dev), Chromium route. */
export interface GotenbergProviderOptions {
  type: 'gotenberg';
  /** Base URL of the Gotenberg server, e.g. `http://localhost:3000`. */
  url: string;
  /** Credentials when Gotenberg runs with `--api-enable-basic-auth`. */
  basicAuth?: { username: string; password: string };
  /** Extra headers sent with every request (e.g. an `Authorization` bearer for a proxy). */
  headers?: Record<string, string>;
}

/** Renders the PDF with the Api2Pdf SaaS (https://www.api2pdf.com), Chrome endpoint. */
export interface Api2PdfProviderOptions {
  type: 'api2pdf';
  /** Api2Pdf API key, sent as the `Authorization` header. */
  apiKey: string;
  /** API base URL. Default: `https://v2.api2pdf.com` */
  baseUrl?: string;
  /** Extra headers sent with every request. */
  headers?: Record<string, string>;
}

export type PdfProviderOptions =
  PuppeteerProviderOptions | GotenbergProviderOptions | Api2PdfProviderOptions;

/** A file sent to Gotenberg next to `index.html`, so the HTML can reference it by name. */
export interface GotenbergAsset {
  /** File name, as referenced from the HTML (e.g. `logo.png`, `style.css`). */
  filename: string;
  content: Uint8Array | string;
  /** MIME type. Default: `application/octet-stream` */
  contentType?: string;
}

/** Per-call options only read by the Gotenberg provider. */
export interface GotenbergRenderOptions {
  /** Local files (images, fonts, CSS...) the HTML references by relative name. */
  assets?: Array<GotenbergAsset>;
  /**
   * Raw Gotenberg form fields (e.g. `{ pdfa: 'PDF/A-2b', waitDelay: '1s' }`),
   * sent after the ones derived from `pdfOptions`, so they win.
   */
  formFields?: Record<string, string>;
}

/** Per-call options only read by the Api2Pdf provider. */
export interface Api2PdfRenderOptions {
  /** Name of the generated file on Api2Pdf's side. */
  fileName?: string;
  /**
   * Raw Api2Pdf Chrome `options` (e.g. `{ delay: 500 }`), merged over the ones
   * derived from `pdfOptions`, so they win.
   */
  options?: Record<string, unknown>;
}
