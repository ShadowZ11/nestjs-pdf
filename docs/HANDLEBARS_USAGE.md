# Handlebars Template Support

This guide shows how to use Handlebars templates with nestjs-pdf to generate PDFs with dynamic content.

## Installation

Handlebars support is built-in with the `@gboutte/nestjs-hbs` package, which is already included as a dependency.

## Usage

### Basic Setup

Configure Handlebars options in your NestJS application:

```typescript
import { Module } from '@nestjs/common';
import { NestjsPdfModule } from '@shad0wz7/nestjs-pdf';

@Module({
  imports: [
    NestjsPdfModule.forRoot({
      hbsOptions: {
        templateDirectory: getRelativePathToValue(__dirname, './templates'),
        templateOptions: {
          helpers: handlebarsHelpers() as HelperDeclareSpec // Optional: Add custom helpers here
        },
        compileOptions: {
          strict: true
        }
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

  // Generate PDF from Handlebars string
  async generateHandlebarsPdf(): Promise<Uint8Array> {
    const handlebarsTemplate = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .header { color: #1abc9c; font-size: 24px; font-weight: bold; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #1abc9c; color: white; }
          </style>
        </head>
        <body>
          <div class="header">Invoice #{{invoiceNumber}}</div>
          <p><strong>Customer:</strong> {{customerName}}</p>
          <p><strong>Invoice Date:</strong> {{invoiceDate}}</p>
          <p><strong>Due Date:</strong> {{dueDate}}</p>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {{#each items}}
              <tr>
                <td>{{this.name}}</td>
                <td>{{this.quantity}}</td>
                <td>${{this.price}}</td>
                <td>${{this.total}}</td>
              </tr>
              {{/each}}
            </tbody>
          </table>
          
          <p style="margin-top: 20px;"><strong>Total Amount:</strong> ${{totalAmount}}</p>
        </body>
      </html>
    `;

    return this.pdfService.generatePdfFromTemplateString(handlebarsTemplate, {
      invoiceNumber: '001',
      customerName: 'John Doe',
      invoiceDate: '2024-05-12',
      dueDate: '2024-06-12',
      items: [
        { name: 'Service A', quantity: 1, price: 500, total: 500 },
        { name: 'Service B', quantity: 2, price: 300, total: 600 },
      ],
      totalAmount: 1100,
    });
  }

  // Generate PDF from Handlebars file
  async generateHandlebarsPdfFromFile(): Promise<Uint8Array> {
    return this.pdfService.generatePdfFromTemplateFile(
      './templates/invoice.hbs',
      {
        invoiceNumber: '001',
        customerName: 'John Doe',
        invoiceDate: '2024-05-12',
        dueDate: '2024-06-12',
        items: [
          { name: 'Service A', quantity: 1, price: 500, total: 500 },
          { name: 'Service B', quantity: 2, price: 300, total: 600 },
        ],
        totalAmount: 1100,
      },
    );
  }
}
```

## API Methods

### `generatePdfFromTemplateString(template: string, parameters?: any, options?: PuppeteerParameters)`

Generates a PDF from a Handlebars template provided as a string.

**Parameters:**
- `template` (string): Handlebars template with HTML/CSS
- `parameters` (any): Data to inject into the template (optional)
- `options` (PuppeteerParameters): PDF generation options (optional)

**Returns:** `Promise<Uint8Array>` - The generated PDF as bytes

**Example:**
```typescript
const handlebarsTemplate = `<h1>Hello {{name}}!</h1>`;
const pdf = await this.pdfService.generatePdfFromTemplateString(
  handlebarsTemplate,
  { name: 'World' },
  { pdfOptions: { format: 'A4' } }
);
```

### `generatePdfFromTemplateFile(file: string, parameters?: any, options?: PuppeteerParameters)`

Generates a PDF from a Handlebars template file.

**Parameters:**
- `file` (string): Path to the .hbs file
- `parameters` (any): Data to inject into the template (optional)
- `options` (PuppeteerParameters): PDF generation options (optional)

**Returns:** `Promise<Uint8Array>` - The generated PDF as bytes

**Example:**
```typescript
const pdf = await this.pdfService.generatePdfFromTemplateFile(
  './templates/invoice.hbs',
  {
    customerName: 'John Doe',
    total: 1000,
  },
);
```

## Handlebars Features

Handlebars provides powerful templating capabilities:

- **Variable interpolation**: `{{variable}}`
- **Iteration**: `{{#each items}}...{{/each}}`
- **Conditionals**: `{{#if condition}}...{{else}}...{{/if}}`
- **Nested data**: `{{person.name}}`
- **Custom helpers**: Define your own helpers for custom logic
- **Partial templates**: Include other templates within your template

### Common Helpers

```handlebars
{{! Comments }}

{{#if condition}}
  {{name}}
{{/if}}

{{#each items}}
  <li>{{this}}</li>
{{/each}}

{{#unless condition}}
  Content
{{/unless}}

{{>partialName}}
```

## Comparison with MJML

| Feature | Handlebars | MJML |
|---------|-----------|------|
| Template syntax | `{{variable}}` | MJML markup |
| Data binding | Yes (with parameters) | Limited (static templates) |
| Dynamic content | Excellent | Not recommended |
| Responsive design | Manual CSS | Built-in |
| Best for | Dynamic content | Email templates |

## Notes

- Handlebars templates are synchronously rendered
- Parameters are passed directly to the template renderer
- You can use inline HTML/CSS within your Handlebars templates
- The `viewsDir` option should point to where your `.hbs` files are stored
- For complex PDF layouts, combine Handlebars with CSS media queries for print-friendly styling

## Best Practices

1. **Use CSS for print styling**: Add `@media print` rules to your CSS
2. **Separate templates**: Keep complex templates in separate `.hbs` files
3. **Data validation**: Ensure all required data is provided before rendering
4. **CSS media queries**: Use `@media print` for PDF-specific styling

### Example with print CSS:

```handlebars
<html>
  <head>
    <style>
      @media print {
        body { font-size: 12pt; }
        .no-print { display: none; }
        .page-break { page-break-after: always; }
      }
    </style>
  </head>
  <body>
    <h1>{{title}}</h1>
    <div class="content">
      {{content}}
    </div>
  </body>
</html>
```

