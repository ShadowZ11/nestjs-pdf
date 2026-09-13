import { NestjsPdfErrorCode, NestjsPdfException } from './nestjs-pdf.exception';

export class EngineNotAvailableException extends NestjsPdfException {
  readonly code = NestjsPdfErrorCode.ENGINE_NOT_AVAILABLE;

  constructor(engineName: string) {
    super(
      `${engineName} service is not available. If the problem persists, open an issue in the repo.`,
    );
  }
}
