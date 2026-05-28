# Mustache Template Engine - NestJS PDF Library

This guide explains how to use the Mustache template engine with the NestJS PDF library to generate PDF documents from Mustache templates.

## What is Mustache?

Mustache is a logic-less template language that is widely used across different programming languages. It emphasizes readable, simple templates and is known for its intuitive syntax. Mustache templates use double curly braces (`{{` and `}}`) to denote variables and logic sections.

### Key Features

- **Logic-less**: Templates don't contain complex programming logic
- **Simple Syntax**: Easy to learn and understand
- **Portable**: Can be used in virtually any programming language
- **Performance**: Lightweight and fast rendering
- **Caching**: Built-in template caching for improved performance

## Installation

Mustache support is optional. To use it, install the Mustache package:

```bash
npm install mustache
npm install --save-dev @types/mustache
```

Or with pnpm:

```bash
pnpm add mustache
pnpm add -D @types/mustache
```

## Basic Usage

### Module Setup

First, import the `NestjsPdfModule` in your NestJS application:

```typescript
import { Module } from '@nestjs/common';
import { NestjsPdfModule } from '@shad0wz7/nestjs-pdf';

@Module({
  imports: [
    NestjsPdfModule.forRoot({
      // Optional Puppeteer parameters
      headless: true,
      args: ['--no-sandbox'],
    }),
  ],
})
export class AppModule {}
```

### Generating PDF from Mustache String

```typescript
import { Injectable } from '@nestjs/common';
import { NestjsPdfService } from '@shad0wz7/nestjs-pdf';

@Injectable()
export class DocumentService {
  constructor(private readonly pdfService: NestjsPdfService) {}

  async generateInvoice() {
    const template = `
      <html>
        <h1>Invoice for {{customerName}}</h1>
        <p>Date: {{date}}</p>
      </html>
    `;

    const data = {
      customerName: 'John Doe',
      date: new Date().toLocaleDateString(),
    };

    const pdf = await this.pdfService.generatePdfFromMustacheString(
      template,
      data,
    );

    return pdf;
  }
}
```

### Generating PDF from Mustache File

```typescript
async generateInvoiceFromFile() {
  const data = {
    customerName: 'Jane Smith',
    date: new Date().toLocaleDateString(),
    items: [
      { name: 'Item 1', price: 29.99 },
      { name: 'Item 2', price: 49.99 },
    ],
  };

  const pdf = await this.pdfService.generatePdfFromMustacheFile(
    'path/to/template.mustache',
    data,
  );

  return pdf;
}
```

## Mustache Syntax Guide

### Variables

Display values from the data object:

```mustache
<p>Hello {{name}}!</p>
```

### Sections (Conditionals)

Show content conditionally:

```mustache
{{#show}}
  <p>This is visible when show is true</p>
{{/show}}

{{^show}}
  <p>This is visible when show is false</p>
{{/show}}
```

### Arrays/Loops

Iterate over arrays:

```mustache
<ul>
  {{#items}}
  <li>{{name}} - ${{price}}</li>
  {{/items}}
</ul>
```

### Nested Objects

Access nested properties:

```mustache
<p>{{user.name}} - {{user.email}}</p>
```

### Comments

Add comments that won't be rendered:

```mustache
{{! This is a comment and won't appear in the output }}
```

### Escaped Output

By default, Mustache escapes HTML characters. To output raw HTML:

```mustache
{{html}}         {{! Escaped }}
{{{html}}}       {{! Raw HTML }}
{{&html}}        {{! Raw HTML }}
```

## Advanced Usage

### Custom Options

You can pass custom Mustache options when rendering:

```typescript
const options = {
  tags: ['<%', '%>'], // Custom delimiters
};

const pdf = await this.pdfService.generatePdfFromMustacheString(
  template,
  data,
  {
    mustacheOptions: options,
  },
);
```

### Caching

The Mustache service includes built-in template caching. When rendering from a file, templates are automatically cached to improve performance:

```typescript
import { MustacheService } from '@shad0wz7/nestjs-pdf';

constructor(private readonly mustacheService: MustacheService) {}

// Clear cache when needed
this.mustacheService.clearCache();

// Get cache size
const cacheSize = this.mustacheService.getCacheSize();
```

## Complete Example

### Template File (invoice.mustache)

```mustache
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #4CAF50; color: white; }
      .total { font-weight: bold; font-size: 18px; }
    </style>
  </head>
  <body>
    <h1>Invoice</h1>
    <p><strong>Customer:</strong> {{customerName}}</p>
    <p><strong>Date:</strong> {{date}}</p>
    
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Quantity</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {{#items}}
        <tr>
          <td>{{description}}</td>
          <td>{{quantity}}</td>
          <td>${{price}}</td>
          <td>${{total}}</td>
        </tr>
        {{/items}}
      </tbody>
    </table>
    
    <p class="total">Grand Total: ${{grandTotal}}</p>
  </body>
</html>
```

### Service Implementation

```typescript
import { Injectable } from '@nestjs/common';
import { NestjsPdfService } from '@shad0wz7/nestjs-pdf';

@Injectable()
export class InvoiceService {
  constructor(private readonly pdfService: NestjsPdfService) {}

  async generateInvoice(invoiceData: any) {
    return await this.pdfService.generatePdfFromMustacheFile(
      'templates/invoice.mustache',
      {
        customerName: invoiceData.customer.name,
        date: new Date().toLocaleDateString(),
        items: invoiceData.items.map(item => ({
          description: item.name,
          quantity: item.qty,
          price: item.unitPrice.toFixed(2),
          total: (item.qty * item.unitPrice).toFixed(2),
        })),
        grandTotal: invoiceData.items
          .reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
          .toFixed(2),
      },
    );
  }
}
```

### Controller

```typescript
import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { InvoiceService } from './invoice.service';

@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post('generate')
  async generateInvoice(@Body() data: any, @Res() response: Response) {
    const pdf = await this.invoiceService.generateInvoice(data);
    
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="invoice.pdf"',
    });
    response.send(pdf);
  }
}
```

## Best Practices

1. **Use Logic-less Templates**: Keep business logic in your service layer, not in templates
2. **Template Reusability**: Create modular templates that can be reused across different services
3. **Performance**: Leverage template caching for frequently-used templates
4. **Error Handling**: Always wrap PDF generation in try-catch blocks
5. **Data Validation**: Validate input data before passing to template rendering
6. **Cache Management**: Clear cache when templates are updated

## Comparison with Other Template Engines

| Feature | Mustache | Handlebars | EJS | Pug | Nunjucks |
|---------|----------|-----------|-----|-----|----------|
| Syntax Complexity | Very Simple | Simple | Medium | Complex | Medium |
| Logic Support | No | Yes | Yes | Yes | Yes |
| Performance | Fast | Fast | Medium | Fast | Medium |
| Learning Curve | Easiest | Easy | Medium | Hard | Medium |
| Template Inheritance | No | Yes | Limited | Yes | Yes |
| Partials/Includes | Yes | Yes | Yes | Yes | Yes |

## Troubleshooting

### "Mustache service is not available" Error

This error occurs when the Mustache package is not installed. Install it with:

```bash
npm install mustache @types/mustache
```

### Template Not Rendering Correctly

1. Check the file path is correct (use absolute paths)
2. Verify all variables in the template exist in the data object
3. Use `{{{` for raw HTML output if HTML is being escaped
4. Check for typos in variable names

### Performance Issues

1. Use file-based templates with caching enabled
2. Reduce the complexity of your templates
3. Clear unused cache entries periodically
4. Consider pre-rendering static parts

## Additional Resources

- [Mustache Official Documentation](https://mustache.github.io/)
- [Mustache.js GitHub](https://github.com/janl/mustache.js)
- [Logic-less Templates Pattern](https://mustache.github.io/)

## Support

For issues or questions related to Mustache integration with this library, please open an issue on the [GitHub repository](https://github.com/ShadowZ11/nestjs-pdf).

