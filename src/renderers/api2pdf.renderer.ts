import { PdfGenerationException } from '../exceptions';
import type { PuppeteerParameters } from '../puppeteer/puppeteer-parameters.interface';
import { assertNoRequestGuard, httpError, requireNonEmpty } from './http.utils';
import { toApi2PdfOptions } from './pdf-options.mapper';
import type { Api2PdfProviderOptions } from './pdf-provider.interface';
import type { PdfRenderer } from './pdf-renderer.interface';

const PROVIDER = 'Api2Pdf';
const DEFAULT_BASE_URL = 'https://v2.api2pdf.com';
const ROUTE = '/chrome/pdf/html';

interface Api2PdfResponse {
  Success?: boolean;
  Error?: string | null;
  FileUrl?: string | null;
}

function isApi2Pdf(data: unknown): data is Api2PdfResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    ('Success' in data || 'Error' in data || 'FileUrl' in data)
  );
}

export class Api2PdfRenderer implements PdfRenderer {
  readonly #endpoint: string;
  readonly #headers: Record<string, string>;

  constructor(provider: Api2PdfProviderOptions) {
    const apiKey = requireNonEmpty(provider.apiKey, 'apiKey', PROVIDER);
    const baseUrl = requireNonEmpty(
      provider.baseUrl ?? DEFAULT_BASE_URL,
      'baseUrl',
      PROVIDER,
    ).replace(/\/+$/, '');
    this.#endpoint = `${baseUrl}${ROUTE}?outputBinary=true`;
    this.#headers = {
      ...provider.headers,
      Authorization: apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/pdf, application/json',
    };
  }

  async render(
    html: string,
    options: PuppeteerParameters,
    signal?: AbortSignal,
  ): Promise<Uint8Array> {
    assertNoRequestGuard(
      PROVIDER,
      options,
      'Only render trusted HTML with a remote provider.',
    );

    const api2pdfOptions = {
      ...toApi2PdfOptions(options.pdfOptions ?? { format: 'A4' }),
      ...options.api2pdfOptions?.options,
    };
    const body: Record<string, unknown> = {
      html,
      inline: false,
      options: api2pdfOptions,
    };
    if (options.api2pdfOptions?.fileName) {
      body.fileName = options.api2pdfOptions.fileName;
    }

    const response = await fetch(this.#endpoint, {
      method: 'POST',
      headers: this.#headers,
      body: JSON.stringify(body),
      signal,
    });
    if (!response.ok) {
      throw await httpError(PROVIDER, response);
    }

    if (!response.headers.get('content-type')?.includes('application/json')) {
      return new Uint8Array(await response.arrayBuffer());
    }

    const result: unknown = await response.json();
    if (!isApi2Pdf(result)) {
      throw new PdfGenerationException(
        `${PROVIDER} returned an unexpected response: ${JSON.stringify(result)}`,
      );
    }
    if (result.Success === false || !result.FileUrl) {
      throw new PdfGenerationException(
        `${PROVIDER} could not generate the PDF: ${result.Error ?? 'no file returned'}`,
      );
    }

    const file = await fetch(result.FileUrl, { signal });
    if (!file.ok) {
      throw await httpError(PROVIDER, file);
    }
    return new Uint8Array(await file.arrayBuffer());
  }
}
