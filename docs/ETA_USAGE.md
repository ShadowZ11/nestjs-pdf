# Eta Template Engine - NestJS PDF Library

This guide explains how to use the Eta template engine with the NestJS PDF library to generate PDF documents from Eta templates.

## What is Eta?

Eta is a fast and lightweight embedded templating language. It's designed to be simple, lightweight, and fast while still supporting powerful features like layouts, caching, and async support. Eta templates use `<%= %>` syntax for variable interpolation and `<% %>` for code execution.

### Key Features

- **Lightweight**: Very small library with minimal dependencies
- **Fast**: Optimized for performance
- **Simple Syntax**: Easy to learn and use
- **Powerful**: Supports async, partials, layouts, and filters
- **Flexible**: Works with various data types
- **Caching**: Built-in template caching for improved performance

## Installation

Eta support is optional. To use it, install the Eta package:

```bash
npm install eta
```

Or with pnpm:

```bash
pnpm add eta
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

### Generating PDF from Eta String

```typescript
import { Injectable } from '@nestjs/common';
import { NestjsPdfService } from '@shad0wz7/nestjs-pdf';

@Injectable()
export class DocumentService {
  constructor(private readonly pdfService: NestjsPdfService) {}

  async generateInvoice() {
    const template = `
      <html>
        <h1>Invoice for <%= it.customerName %></h1>
        <p>Date: <%= it.date %></p>
      </html>
    `;

    const data = {
      customerName: 'John Doe',
      date: new Date().toLocaleDateString(),
    };

    const pdf = await this.pdfService.generatePdfFromEtaString(
      template,
      data,
    );

    return pdf;
  }
}
```

### Generating PDF from Eta File

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

  const pdf = await this.pdfService.generatePdfFromEtaFile(
    'path/to/template.eta',
    data,
  );

  return pdf;
}
```

## Eta Syntax Guide

### Variables

Display values from the data object:

```eta
<p>Hello <%= it.name %>!</p>
```

### Escaped Output

Variables are escaped by default. To output raw HTML:

```eta
<%~ it.htmlContent %>
```

### Code Blocks

Execute JavaScript code:

```eta
<% 
  const name = it.firstName + ' ' + it.lastName;
  const age = new Date().getFullYear() - it.birthYear;
%>
<p>Name: <%= name %>, Age: <%= age %></p>
```

### Conditionals

Use if/else statements:

```eta
<% if (it.show) { %>
  <p>This is visible</p>
<% } else { %>
  <p>This is hidden</p>
<% } %>
```

### Loops

Iterate over arrays:

```eta
<ul>
<% it.items.forEach(item => { %>
  <li><%= item.name %> - $<%= item.price %></li>
<% }) %>
</ul>
```

### Conditionals with &&

Use shortcuts for conditional rendering:

```eta
<% it.show && %>
  <p>This shows if it.show is true</p>
<% end %>
```

### Nested Objects

Access nested properties:

```eta
<p><%= it.user.name %> - <%= it.user.email %></p>
```

## Advanced Usage

### Custom Options

You can pass custom Eta options when rendering:

```typescript
const options = {
  cache: true,
  autoEscape: true,
  useWith: true,
};

const pdf = await this.pdfService.generatePdfFromEtaString(
  template,
  data,
  {
    etaOptions: options,
  },
);
```

### Caching

The Eta service includes built-in template caching. When rendering from a file, templates are automatically cached to improve performance:

```typescript
import { EtaService } from '@shad0wz7/nestjs-pdf';

constructor(private readonly etaService: EtaService) {}

// Clear cache when needed
this.etaService.clearCache();

// Get cache size
const cacheSize = this.etaService.getCacheSize();
```

## Complete Example

### Template File (invoice.eta)

```eta
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
    <p><strong>Customer:</strong> <%= it.customerName %></p>
    <p><strong>Date:</strong> <%= it.date %></p>
    
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
        <% it.items.forEach(item => { %>
        <tr>
          <td><%= item.description %></td>
          <td><%= item.quantity %></td>
          <td>$<%= item.price %></td>
          <td>$<%= item.total %></td>
        </tr>
        <% }) %>
      </tbody>
    </table>
    
    <p class="total">Grand Total: $<%= it.grandTotal %></p>
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
    return await this.pdfService.generatePdfFromEtaFile(
      'templates/invoice.eta',
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

1. **Cache Management**: Use caching for frequently-rendered templates
2. **Error Handling**: Always wrap PDF generation in try-catch blocks
3. **Data Validation**: Validate input data before passing to template rendering
4. **Template Organization**: Store templates in a dedicated directory
5. **Performance**: Consider using async rendering for large data sets
6. **Security**: Escape user input to prevent XSS attacks

## Comparison with Other Template Engines

| Feature | Eta | Nunjucks | EJS | Handlebars | Mustache |
|---------|-----|----------|-----|-----------|----------|
| Syntax Complexity | Simple | Medium | Medium | Simple | Very Simple |
| Performance | Very Fast | Medium | Medium | Fast | Fast |
| Learning Curve | Easy | Medium | Medium | Easy | Easiest |
| Async Support | Yes | Yes | Yes | Limited | No |
| Partials/Includes | Yes | Yes | Yes | Yes | Yes |
| Caching | Yes | Yes | Yes | Yes | Yes |

## Troubleshooting

### "Eta service is not available" Error

This error occurs when the Eta package is not installed. Install it with:

```bash
npm install eta
```

### Template Not Rendering Correctly

1. Check the file path is correct (use absolute paths)
2. Verify all variables in the template exist in the data object
3. Use `<%~ %>` for raw HTML output if HTML is being escaped
4. Check for typos in variable names (variables should use `it.` prefix)

### Performance Issues

1. Use file-based templates with caching enabled
2. Reduce the complexity of your templates
3. Clear unused cache entries periodically
4. Consider pre-rendering static parts

## Additional Resources

- [Eta Official Documentation](https://eta.js.org/)
- [Eta GitHub Repository](https://github.com/eta-dev/eta)
- [Embedded Templating Pattern](https://eta.js.org/)

## Support

For issues or questions related to Eta integration with this library, please open an issue on the [GitHub repository](https://github.com/ShadowZ11/nestjs-pdf).

