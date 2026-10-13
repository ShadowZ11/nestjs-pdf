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

| Exception                        | `code`                         | Thrown when                                                                                                                                                                                                                                                         | Extra properties                       |
| -------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `EngineNotAvailableException`    | `ENGINE_NOT_AVAILABLE`         | You render a template with an engine whose package (`handlebars`, `ejs`, `pug`, `mjml`, `nunjucks`, `eta`, `mustache`) isn't installed in your project. Thrown on first use of that engine, not at startup. See [Missing template engine](#missing-template-engine) | -                                      |
| `TemplateConfigurationException` | `TEMPLATE_CONFIGURATION_ERROR` | Misconfiguration/misuse: missing `templateDirectory`, a file path escaping `templateDirectory`, a missing `partialDirectory`                                                                                                                                        | -                                      |
| `TemplateRenderException`        | `TEMPLATE_RENDER_ERROR`        | A template engine (Handlebars, Pug, EJS, Nunjucks, Eta, Mustache, MJML) fails to compile/render a template or read a template file                                                                                                                                  | `engine: string` (e.g. `'Handlebars'`) |
| `BrowserInstallationException`   | `BROWSER_INSTALLATION_ERROR`   | Puppeteer's browser binary could not be installed/resolved                                                                                                                                                                                                          | -                                      |
| `BrowserUnavailableException`    | `BROWSER_UNAVAILABLE`          | A new PDF job is requested while the module is shutting down                                                                                                                                                                                                        | -                                      |
| `PdfGenerationException`         | `PDF_GENERATION_ERROR`         | The Puppeteer page fails to render/print the PDF (navigation, timeout, etc.)                                                                                                                                                                                        | -                                      |
| `SignatureDependencyException`   | `SIGNATURE_DEPENDENCY_ERROR`   | `pdfjs-dist` (and its `@napi-rs/canvas` peer dependency) can't be loaded for anchor-based signature placement                                                                                                                                                       | -                                      |
| `SignaturePlacementException`    | `SIGNATURE_PLACEMENT_ERROR`    | The page targeted for signature placement doesn't exist in the PDF                                                                                                                                                                                                  | -                                      |
| `WatermarkException`             | `WATERMARK_ERROR`              | Invalid watermark options (no `text`/`image`, bad `color`/`opacity`/`fontSize`/`imageWidth`/`tileSpacing`, out-of-range `pages`, non-PNG/JPEG image, text outside WinAnsi) or a PDF that can't be processed                                                         | -                                      |

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
  WatermarkException,
} from '@shad0wz7/nestjs-pdf';
```

## Missing template engine

Template engines are optional peer dependencies of nestjs-pdf: none of them is
installed with the library. Each engine is loaded the first time you render a
template with it, so your application starts with any subset of engines
installed, and the error only surfaces when a missing engine is actually used.

The `EngineNotAvailableException` message tells you which package to install,
and its `cause` holds the original Node.js `MODULE_NOT_FOUND` error:

```text
Pug engine is not available: the 'pug' package is not installed. Run `npm install pug` to use it.
```

| Engine     | Package to install |
| ---------- | ------------------ |
| Handlebars | `handlebars`       |
| EJS        | `ejs`              |
| Pug        | `pug`              |
| MJML       | `mjml`             |
| Nunjucks   | `nunjucks`         |
| Eta        | `eta`              |
| Mustache   | `mustache`         |

This is a configuration problem rather than a runtime one: install the package
instead of catching the exception. If the package is installed but fails while
loading (e.g. a broken install), the original error is rethrown as-is.

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
        // The `handlebars` package is not installed in your project
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
  [NestjsPdfErrorCode.WATERMARK_ERROR]: HttpStatus.BAD_REQUEST,
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
- The library doesn't log on your behalf when throwing these exceptions, except during the Puppeteer step (page rendering/printing and watermark stamping): any error raised there is passed to `Logger.error` before being rethrown. Beyond that, logging is left to the consumer via the `catch` block.
- If a `NestjsPdfException` is thrown during the Puppeteer step (e.g. a `WatermarkException` or a `BrowserInstallationException`), it is propagated as-is and never wrapped a second time into a `PdfGenerationException`.
- A job cancelled through an `AbortSignal` rejects with the signal's `reason` (an `AbortError` by default, a `TimeoutError` for `AbortSignal.timeout()`), not with a `NestjsPdfException`.
