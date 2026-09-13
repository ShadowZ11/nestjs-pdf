import { NestjsPdfErrorCode, NestjsPdfException } from './nestjs-pdf.exception';

export class SignaturePlacementException extends NestjsPdfException {
  readonly code = NestjsPdfErrorCode.SIGNATURE_PLACEMENT_ERROR;
}
