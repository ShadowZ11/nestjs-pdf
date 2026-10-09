import { NestjsPdfErrorCode, NestjsPdfException } from './nestjs-pdf.exception';

export class EngineNotAvailableException extends NestjsPdfException {
  readonly code = NestjsPdfErrorCode.ENGINE_NOT_AVAILABLE;

  constructor(
    engineName: string,
    packageName?: string,
    options?: { cause?: unknown },
  ) {
    super(
      packageName
        ? `${engineName} engine is not available: the '${packageName}' package is not installed. Run \`npm install ${packageName}\` to use it.`
        : `${engineName} service is not available. If the problem persists, open an issue in the repo.`,
      options,
    );
  }
}
