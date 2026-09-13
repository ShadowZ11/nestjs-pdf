import { NestjsPdfErrorCode, NestjsPdfException } from './nestjs-pdf.exception';

export class BrowserUnavailableException extends NestjsPdfException {
  readonly code = NestjsPdfErrorCode.BROWSER_UNAVAILABLE;
}
