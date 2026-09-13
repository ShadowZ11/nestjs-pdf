# Error Handling

nestjs-pdf throws typed exceptions instead of generic `Error`s so you can
distinguish failure modes (a missing template engine vs. a rendering bug vs.
a browser installation problem) and react/log accordingly, without parsing
error messages.

All exceptions:

- extend the abstract `NestjsPdfException` class (itself a subclass of `Error`)
- expose a stable `code` property (`NestjsPdfErrorCode` enum) you can switch on
- preserve the original underlying error via the standard `cause` property when relevant, so nothing is lost for logging/debugging

## Exception hierarchy

| Exception                        | `code`                         | Thrown when                                                                                                                        | Extra properties                       |
| -------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `EngineNotAvailableException`    | `ENGINE_NOT_AVAILABLE`         | You call a `generatePdfFrom<Engine>...` method but the corresponding engine module isn't installed                                 | -                                      |
| `TemplateConfigurationException` | `TEMPLATE_CONFIGURATION_ERROR` | Misconfiguration/misuse: missing `templateDirectory`, a file path escaping `templateDirectory`, a missing `partialDirectory`       | -                                      |
| `TemplateRenderException`        | `TEMPLATE_RENDER_ERROR`        | A template engine (Handlebars, Pug, EJS, Nunjucks, Eta, Mustache, MJML) fails to compile/render a template or read a template file | `engine: string` (e.g. `'Handlebars'`) |
| `BrowserInstallationException`   | `BROWSER_INSTALLATION_ERROR`   | Puppeteer's browser binary could not be installed/resolved                                                                         | -                                      |
| `BrowserUnavailableException`    | `BROWSER_UNAVAILABLE`          | A new PDF job is requested while the module is shutting down                                                                       | -                                      |
| `PdfGenerationException`         | `PDF_GENERATION_ERROR`         | The Puppeteer page fails to render/print the PDF (navigation, timeout, etc.)                                                       | -                                      |
| `SignatureDependencyException`   | `SIGNATURE_DEPENDENCY_ERROR`   | `pdfjs-dist` (and its `@napi-rs/canvas` peer dependency) can't be loaded for anchor-based signature placement                      | -                                      |
| `SignaturePlacementException`    | `SIGNATURE_PLACEMENT_ERROR`    | The page targeted for signature placement doesn't exist in the PDF                                                                 | -                                      |

All of the above, plus the base `NestjsPdfException` class and the
`NestjsPdfErrorCode` enum, are exported from the package root:

```typescript
import {
  NestjsPdfException,
  NestjsPdfErrorCode,
  EngineNotAvailableException,
  TemplateConfigurationException,
  TemplateRenderException,
  BrowserInstallationException,
  BrowserUnavailableException,
  PdfGenerationException,
  SignatureDependencyException,
  SignaturePlacementException,
} from '@shad0wz7/nestjs-pdf';
```

## Catching a specific exception

```typescript
import { Injectable, Logger } from '@nestjs/common';
import {
  NestjsPdfService,
  TemplateRenderException,
  EngineNotAvailableException,
  PdfGenerationException,
} from '@shad0wz7/nestjs-pdf';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(private readonly pdfService: NestjsPdfService) {}

  async generateInvoice(template: string, data: Record<string, unknown>) {
    try {
      return await this.pdfService.generatePdfFromTemplateHbsString(
        template,
        data,
      );
    } catch (error) {
      if (error instanceof EngineNotAvailableException) {
        // The Handlebars package is not installed as a peer dependency
        this.logger.error(error.message);
        throw error;
      }

      if (error instanceof TemplateRenderException) {
        // Template compilation/rendering failed — surface `engine` + `cause`
        this.logger.error(
          `${error.engine} template failed: ${error.message}`,
          error.cause instanceof Error ? error.cause.stack : error.cause,
        );
        throw error;
      }

      if (error instanceof PdfGenerationException) {
        // Puppeteer failed to render the page to PDF
        this.logger.error(error.message, (error.cause as Error)?.stack);
        throw error;
      }

      throw error;
    }
  }
}
```

## Catching by error code

If you prefer a single catch block, every exception exposes a stable `code`:

```typescript
import { NestjsPdfException, NestjsPdfErrorCode } from '@shad0wz7/nestjs-pdf';

try {
  await pdfService.generatePdfFromHtml(html);
} catch (error) {
  if (error instanceof NestjsPdfException) {
    switch (error.code) {
      case NestjsPdfErrorCode.PDF_GENERATION_ERROR:
        // retry, alert, etc.
        break;
      case NestjsPdfErrorCode.BROWSER_UNAVAILABLE:
        // the module is shutting down, don't retry
        break;
      default:
        logger.error(error.code, error.message);
    }
    return;
  }

  throw error; // not a nestjs-pdf error, let it bubble up
}
```

## Mapping to HTTP responses with a NestJS exception filter

Because every exception is a plain `Error` subclass, you can map them to
HTTP responses using a regular NestJS exception filter:

```typescript
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { NestjsPdfException, NestjsPdfErrorCode } from '@shad0wz7/nestjs-pdf';

const STATUS_BY_CODE: Record<NestjsPdfErrorCode, number> = {
  [NestjsPdfErrorCode.ENGINE_NOT_AVAILABLE]: HttpStatus.INTERNAL_SERVER_ERROR,
  [NestjsPdfErrorCode.TEMPLATE_CONFIGURATION_ERROR]: HttpStatus.BAD_REQUEST,
  [NestjsPdfErrorCode.TEMPLATE_RENDER_ERROR]: HttpStatus.BAD_REQUEST,
  [NestjsPdfErrorCode.BROWSER_INSTALLATION_ERROR]:
    HttpStatus.INTERNAL_SERVER_ERROR,
  [NestjsPdfErrorCode.BROWSER_UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [NestjsPdfErrorCode.PDF_GENERATION_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [NestjsPdfErrorCode.SIGNATURE_DEPENDENCY_ERROR]:
    HttpStatus.INTERNAL_SERVER_ERROR,
  [NestjsPdfErrorCode.SIGNATURE_PLACEMENT_ERROR]: HttpStatus.BAD_REQUEST,
};

@Catch(NestjsPdfException)
export class NestjsPdfExceptionFilter implements ExceptionFilter {
  catch(exception: NestjsPdfException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = STATUS_BY_CODE[exception.code];

    response.status(status).json({
      statusCode: status,
      code: exception.code,
      message: exception.message,
    });
  }
}
```

## Notes

- `NestjsPdfException` is abstract — you cannot `throw new NestjsPdfException(...)` directly, only its concrete subclasses.
- The library never logs on your behalf when throwing these exceptions (other than the existing `Logger.error` call already made before wrapping into a `PdfGenerationException` for a Puppeteer failure); logging is left entirely to the consumer via the `catch` block.
- If a `NestjsPdfException` is thrown while generating a PDF (e.g. by an `@Optional()` template engine), it is propagated as-is and never wrapped a second time into a `PdfGenerationException`.
