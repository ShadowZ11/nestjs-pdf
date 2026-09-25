import { NestjsPdfErrorCode, NestjsPdfException } from './nestjs-pdf.exception';

export class WatermarkException extends NestjsPdfException {
  readonly code = NestjsPdfErrorCode.WATERMARK_ERROR;
}
