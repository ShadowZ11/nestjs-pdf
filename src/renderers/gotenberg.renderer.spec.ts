import { type Mock, vi } from 'vitest';

import {
  PdfGenerationException,
  RendererConfigurationException,
} from '../exceptions';
import { GotenbergRenderer } from './gotenberg.renderer';

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46]);

function pdfResponse(): Response {
  return new Response(PDF, {
    status: 200,
    headers: { 'content-type': 'application/pdf' },
  });
}

function lastRequest(fetchMock: Mock): { url: string; init: RequestInit } {
  const [url, init] = fetchMock.mock.lastCall as [string, RequestInit];
  return { url, init };
}

describe('GotenbergRenderer', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(pdfResponse());
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should require a url', () => {
    expect(
      () => new GotenbergRenderer({ type: 'gotenberg', url: '  ' }),
    ).toThrow(RendererConfigurationException);
  });

  it('should post the HTML to the Chromium route and return the PDF', async () => {
    const renderer = new GotenbergRenderer({
      type: 'gotenberg',
      url: 'http://gotenberg:3000//',
    });

    const pdf = await renderer.render('<h1>Hi</h1>', {});

    expect(pdf).toEqual(PDF);
    const { url, init } = lastRequest(fetchMock);
    expect(url).toBe('http://gotenberg:3000/forms/chromium/convert/html');
    expect(init.method).toBe('POST');

    const form = init.body as FormData;
    const index = form.get('files') as File;
    expect(index.name).toBe('index.html');
    expect(await index.text()).toBe('<h1>Hi</h1>');
    // Default format of the library: A4.
    expect(form.get('paperWidth')).toBe('8.2677');
    expect(form.get('paperHeight')).toBe('11.6929');
    expect(form.get('emulatedMediaType')).toBe('screen');
  });

  it('should send basic auth and custom headers', async () => {
    const renderer = new GotenbergRenderer({
      type: 'gotenberg',
      url: 'http://gotenberg:3000',
      headers: { 'X-Tenant': 'acme' },
      basicAuth: { username: 'user', password: 'pass' },
    });

    await renderer.render('<p></p>', {});

    expect(lastRequest(fetchMock).init.headers).toEqual({
      'X-Tenant': 'acme',
      Authorization: `Basic ${Buffer.from('user:pass').toString('base64')}`,
    });
  });

  it('should send header/footer, assets and raw form fields', async () => {
    const renderer = new GotenbergRenderer({
      type: 'gotenberg',
      url: 'http://gotenberg:3000',
    });

    await renderer.render('<img src="logo.png">', {
      pdfOptions: {
        format: 'Letter',
        displayHeaderFooter: true,
        headerTemplate: '<span class="title"></span>',
      },
      gotenbergOptions: {
        assets: [
          {
            filename: 'logo.png',
            content: new Uint8Array([1, 2]),
            contentType: 'image/png',
          },
          { filename: 'style.css', content: 'body{}' },
        ],
        formFields: { pdfa: 'PDF/A-2b', emulatedMediaType: 'print' },
      },
    });

    const form = lastRequest(fetchMock).init.body as FormData;
    const files = form.getAll('files') as Array<File>;
    expect(files.map((f) => f.name)).toEqual([
      'index.html',
      'header.html',
      'logo.png',
      'style.css',
    ]);
    expect(files[2].type).toBe('image/png');
    expect(files[3].type).toBe('application/octet-stream');
    expect(await files[3].text()).toBe('body{}');
    expect(form.get('pdfa')).toBe('PDF/A-2b');
    // Raw fields win over the derived ones.
    expect(form.getAll('emulatedMediaType')).toEqual(['print']);
  });

  it('should forward the abort signal', async () => {
    const renderer = new GotenbergRenderer({
      type: 'gotenberg',
      url: 'http://gotenberg:3000',
    });
    const controller = new AbortController();

    await renderer.render('<p></p>', {}, controller.signal);

    expect(lastRequest(fetchMock).init.signal).toBe(controller.signal);
  });

  it('should refuse the security option', async () => {
    const renderer = new GotenbergRenderer({
      type: 'gotenberg',
      url: 'http://gotenberg:3000',
    });

    await expect(renderer.render('<p></p>', { security: {} })).rejects.toThrow(
      RendererConfigurationException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should throw a PdfGenerationException with the response body on error', async () => {
    fetchMock.mockResolvedValue(
      new Response('Invalid form data: paperWidth', { status: 400 }),
    );
    const renderer = new GotenbergRenderer({
      type: 'gotenberg',
      url: 'http://gotenberg:3000',
    });

    const promise = renderer.render('<p></p>', {});
    await expect(promise).rejects.toThrow(PdfGenerationException);
    await expect(promise).rejects.toThrow(
      'Gotenberg responded with HTTP 400: Invalid form data: paperWidth',
    );
  });

  it('should still report the status when the error body cannot be read', async () => {
    const response = new Response(null, { status: 503 });
    vi.spyOn(response, 'text').mockRejectedValue(new Error('stream broken'));
    fetchMock.mockResolvedValue(response);
    const renderer = new GotenbergRenderer({
      type: 'gotenberg',
      url: 'http://gotenberg:3000',
    });

    await expect(renderer.render('<p></p>', {})).rejects.toThrow(
      /^Gotenberg responded with HTTP 503$/,
    );
  });
});
