# MJML Template Support

This guide shows how to use MJML (Mail Markup Language) with nestjs-pdf to generate PDFs from responsive email templates.

## Installation

MJML is already included as a dependency in this library.

## Usage

### Basic Setup

Import the `PuppeteerMjmlModule` along with other PDF modules in your NestJS application:

```typescript
import { Module } from '@nestjs/common';
import { NestjsPdfModule } from '@shad0wz7/nestjs-pdf';
import { PuppeteerMjmlModule } from '@shad0wz7/nestjs-pdf';

@Module({
  imports: [
    NestjsPdfModule.forRoot({
      hbsOptions: {
        // Handlebars options (optional)
      },
      mjmlOptions: {
        // MJML options (optional)
      },
    }),
  ],
  controllers: [MyController],
  providers: [MyService],
})
export class AppModule {}
```

### Using the Service

Inject the `NestjsPdfService` into your service or controller:

```typescript
import { Injectable } from '@nestjs/common';
import { NestjsPdfService } from '@shad0wz7/nestjs-pdf';

@Injectable()
export class MyService {
  constructor(private readonly pdfService: NestjsPdfService) {}

  // Generate PDF from MJML string
  async generateMjmlPdf(): Promise<Uint8Array> {
    const mjmlTemplate = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text font-size="20px" align="center" color="#1abc9c">
                Welcome!
              </mj-text>
              <mj-text>
                This is a sample MJML template converted to PDF.
              </mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;

    return this.pdfService.generatePdfFromMjmlString(mjmlTemplate);
  }

  // Generate PDF from MJML file
  async generateMjmlPdfFromFile(): Promise<Uint8Array> {
    return this.pdfService.generatePdfFromMjmlFile(
      '/path/to/template.mjml',
      {},
    );
  }
}
```

## API Methods

### `generatePdfFromMjmlString(template: string, options?: PuppeteerParameters)`

Generates a PDF from an MJML template provided as a string.

**Parameters:**
- `template` (string): MJML template
- `options` (PuppeteerParameters): PDF generation options (optional)

**Returns:** `Promise<Uint8Array>` - The generated PDF as bytes

**Example:**
```typescript
const mjmlTemplate = `<mjml>...</mjml>`;
const pdf = await this.pdfService.generatePdfFromMjmlString(mjmlTemplate, {
  pdfOptions: { format: 'A4' },
});
```

### `generatePdfFromMjmlFile(file: string, options?: PuppeteerParameters)`

Generates a PDF from an MJML template file.

**Parameters:**
- `file` (string): Path to the MJML file
- `options` (PuppeteerParameters): PDF generation options (optional)

**Returns:** `Promise<Uint8Array>` - The generated PDF as bytes

**Example:**
```typescript
const pdf = await this.pdfService.generatePdfFromMjmlFile(
  './templates/email.mjml',
  {},
);
```

## MJML Features

MJML provides a rich set of components for creating responsive email templates:

- `<mj-text>` - Text content
- `<mj-image>` - Images
- `<mj-button>` - Clickable buttons
- `<mj-divider>` - Horizontal dividers
- `<mj-table>` - Tables
- `<mj-social>` - Social media links
- And many more...

For complete MJML documentation, visit: https://mjml.io/documentation

## Comparison with Handlebars

| Feature | Handlebars | MJML |
|---------|-----------|------|
| Template syntax | `{{variable}}` | MJML markup |
| Data binding | Yes (with parameters) | Limited (static templates) |
| Responsive design | Manual CSS | Built-in |
| Best for | Dynamic content | Email templates |

## Notes

- MJML templates are automatically rendered to HTML before being converted to PDF
- MJML is optimized for email templates but works perfectly for PDF generation
- Each MJML component is responsive by default
- Unlike Handlebars, MJML templates don't support parameter injection - use Handlebars if you need dynamic content

