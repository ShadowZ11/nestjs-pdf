import { NestjsPdfErrorCode, NestjsPdfException } from './nestjs-pdf.exception';

export class PdfGenerationException extends NestjsPdfException {
  readonly code = NestjsPdfErrorCode.PDF_GENERATION_ERROR;
}
