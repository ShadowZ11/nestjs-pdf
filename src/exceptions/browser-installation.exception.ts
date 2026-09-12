import { NestjsPdfErrorCode, NestjsPdfException } from './nestjs-pdf.exception';

export class BrowserInstallationException extends NestjsPdfException {
  readonly code = NestjsPdfErrorCode.BROWSER_INSTALLATION_ERROR;
}
