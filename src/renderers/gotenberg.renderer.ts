import type { PuppeteerParameters } from '../puppeteer/puppeteer-parameters.interface';
import { assertNoRequestGuard, httpError, requireNonEmpty } from './http.utils';
import { toGotenbergForm } from './pdf-options.mapper';
import type { GotenbergProviderOptions } from './pdf-provider.interface';
import type { PdfRenderer } from './pdf-renderer.interface';

const PROVIDER = 'Gotenberg';
const ROUTE = '/forms/chromium/convert/html';

export class GotenbergRenderer implements PdfRenderer {
  readonly #endpoint: string;
  readonly #headers: Record<string, string>;

  constructor(provider: GotenbergProviderOptions) {
    const url = requireNonEmpty(provider.url, 'url', PROVIDER);
    this.#endpoint = `${url.replace(/\/+$/, '')}${ROUTE}`;

    this.#headers = { ...provider.headers };
    if (provider.basicAuth) {
      const { username, password } = provider.basicAuth;
      this.#headers.Authorization = `Basic ${Buffer.from(
        `${username}:${password}`,
      ).toString('base64')}`;
    }
  }

  async render(
    html: string,
    options: PuppeteerParameters,
    signal?: AbortSignal,
  ): Promise<Uint8Array> {
    assertNoRequestGuard(
      PROVIDER,
      options,
      "Restrict outbound requests on the Gotenberg server instead, with '--chromium-allow-list' / '--chromium-deny-list'.",
    );

    const { fields, files } = toGotenbergForm(
      options.pdfOptions ?? { format: 'A4' },
    );

    const form = new FormData();
    form.append('files', new Blob([html], { type: 'text/html' }), 'index.html');
    for (const [name, content] of Object.entries(files)) {
      form.append('files', new Blob([content], { type: 'text/html' }), name);
    }
    for (const asset of options.gotenbergOptions?.assets ?? []) {
      form.append(
        'files',
        new Blob([asset.content as BlobPart], {
          type: asset.contentType ?? 'application/octet-stream',
        }),
        asset.filename,
      );
    }
    const allFields = { ...fields, ...options.gotenbergOptions?.formFields };
    for (const [name, value] of Object.entries(allFields)) {
      form.append(name, value);
    }

    const response = await fetch(this.#endpoint, {
      method: 'POST',
      headers: this.#headers,
      body: form,
      signal,
    });
    if (!response.ok) {
      throw await httpError(PROVIDER, response);
    }

    return new Uint8Array(await response.arrayBuffer());
  }
}
