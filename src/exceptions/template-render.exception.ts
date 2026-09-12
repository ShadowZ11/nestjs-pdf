import { NestjsPdfErrorCode, NestjsPdfException } from './nestjs-pdf.exception';

export class TemplateRenderException extends NestjsPdfException {
  readonly code = NestjsPdfErrorCode.TEMPLATE_RENDER_ERROR;

  constructor(
    public readonly engine: string,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
  }
}
