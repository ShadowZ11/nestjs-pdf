import { NestjsPdfErrorCode, NestjsPdfException } from './nestjs-pdf.exception';

export class TemplateConfigurationException extends NestjsPdfException {
  readonly code = NestjsPdfErrorCode.TEMPLATE_CONFIGURATION_ERROR;
}
