import {
  PdfGenerationException,
  RendererConfigurationException,
} from '../exceptions';
import type { PuppeteerParameters } from '../puppeteer/puppeteer-parameters.interface';

const MAX_ERROR_BODY_LENGTH = 500;

/** Builds a `PdfGenerationException` from a failed HTTP response, body included. */
export async function httpError(
  provider: string,
  response: Response,
): Promise<PdfGenerationException> {
  let body = '';
  try {
    body = (await response.text()).trim().slice(0, MAX_ERROR_BODY_LENGTH);
  } catch {
    // The status is enough when the body cannot be read.
  }

  return new PdfGenerationException(
    `${provider} responded with HTTP ${response.status}${body ? `: ${body}` : ''}`,
  );
}

/** Remote providers render on another machine: the local request guard cannot run there. */
export function assertNoRequestGuard(
  provider: string,
  options: PuppeteerParameters,
  hint: string,
): void {
  if (options.security) {
    throw new RendererConfigurationException(
      `The 'security' option is only supported by the puppeteer provider, not by ${provider}. ${hint}`,
    );
  }
}

export function requireNonEmpty(
  value: string | undefined,
  name: string,
  provider: string,
): string {
  if (!value?.trim()) {
    throw new RendererConfigurationException(
      `The ${provider} provider requires a non-empty '${name}'`,
    );
  }
  return value;
}
