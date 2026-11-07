import { NestjsPdfErrorCode, NestjsPdfException } from './nestjs-pdf.exception';

/** The PDF provider is misconfigured, or asked for an option it does not support. */
export class RendererConfigurationException extends NestjsPdfException {
  readonly code = NestjsPdfErrorCode.RENDERER_CONFIGURATION_ERROR;
}
