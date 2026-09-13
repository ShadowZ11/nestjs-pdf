import { NestjsPdfErrorCode, NestjsPdfException } from './nestjs-pdf.exception';

export class SignatureDependencyException extends NestjsPdfException {
  readonly code = NestjsPdfErrorCode.SIGNATURE_DEPENDENCY_ERROR;
}
