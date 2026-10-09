# Liquid Template Engine - NestJS PDF Library

This guide explains how to use the Liquid template engine (via [LiquidJS](https://liquidjs.com/)) with the NestJS PDF library to generate PDF documents from Liquid templates.

## What is Liquid?

Liquid is a safe, customer-facing template language created by Shopify and used by Jekyll, Shopify themes and many CMSs. LiquidJS is a Shopify-compatible implementation for Node.js. Templates use `{{ ... }}` to output values and `{% ... %}` for logic tags.

### Key Features

- **Safe by design**: templates cannot run arbitrary JavaScript, which makes Liquid a good fit for user-editable templates
- **Filters**: a rich set of built-in filters (`upcase`, `date`, `money`-like math with `times`/`plus`/`round`, `map`, `sum`, ...)
- **Partials and layouts**: `{% render %}`, `{% include %}` and `{% layout %}` / `{% block %}`
- **Shopify compatible**: templates written for Shopify/Jekyll work out of the box
- **Caching**: file templates are cached by the service

## Installation

Liquid support is optional. To use it, install the `liquidjs` package (it ships its own TypeScript types):

```bash
npm install liquidjs
```

Or with pnpm:

```bash
pnpm add liquidjs
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
      headless: true,
      // Optional global Liquid options
      liquidOptions: {
        root: ['templates'],
        extname: '.liquid',
      },
    }),
  ],
})
export class AppModule {}
```

### Generating PDF from Liquid String

```typescript
import { Injectable } from '@nestjs/common';
import { NestjsPdfService } from '@shad0wz7/nestjs-pdf';

@Injectable()
export class DocumentService {
  constructor(private readonly pdfService: NestjsPdfService) {}

  async generateInvoice() {
    const template = `
      <html>
        <h1>Invoice for {{ customerName | escape }}</h1>
        <p>Date: {{ date | date: "%Y-%m-%d" }}</p>
      </html>
    `;

    const data = {
      customerName: 'John Doe',
      date: new Date(),
    };

    return this.pdfService.generatePdfFromLiquidString(template, data);
  }
}
```

### Generating PDF from Liquid File

```typescript
async generateInvoiceFromFile() {
  const data = {
    customerName: 'Jane Smith',
    items: [
      { name: 'Item 1', price: 29.99 },
      { name: 'Item 2', price: 49.99 },
    ],
  };

  return this.pdfService.generatePdfFromLiquidFile(
    'templates/invoice.liquid',
    data,
  );
}
```

## Liquid Syntax Guide

### Variables

```liquid
<p>Hello {{ name }}!</p>
<p>{{ user.name }} - {{ user.email }}</p>
```

### Filters

Filters transform output and can be chained:

```liquid
{{ title | upcase }}
{{ price | times: quantity | round: 2 }}
{{ createdAt | date: "%B %d, %Y" }}
{{ items | map: "price" | sum }}
{{ description | truncate: 50 }}
```

### Conditionals

```liquid
{% if user.isAdmin %}
  <p>Admin</p>
{% elsif user.isEditor %}
  <p>Editor</p>
{% else %}
  <p>Viewer</p>
{% endif %}

{% unless paid %}<p class="warning">Unpaid</p>{% endunless %}
```

### Loops

```liquid
<ul>
  {% for item in items %}
    <li>{{ forloop.index }}. {{ item.name }} - ${{ item.price }}</li>
  {% else %}
    <li>No items</li>
  {% endfor %}
</ul>
```

### Variables and captures

```liquid
{% assign total = 0 %}
{% for item in items %}
  {% assign total = total | plus: item.price %}
{% endfor %}
<p>Total: {{ total | round: 2 }}</p>

{% capture greeting %}Hello {{ name }}{% endcapture %}
<h1>{{ greeting }}</h1>
```

### Comments

```liquid
{% comment %}This won't appear in the output{% endcomment %}
{% # inline comment %}
```

### Escaping HTML

Unlike Handlebars or Mustache, **LiquidJS does not escape output by default**. Escape untrusted values with the `escape` filter:

```liquid
<p>{{ userInput | escape }}</p>
```

or enable escaping for every output with the `outputEscape` option (then use the `raw` filter for trusted HTML):

```typescript
await this.pdfService.generatePdfFromLiquidString(template, data, {
  liquidOptions: { outputEscape: 'escape' },
});
```

```liquid
<p>{{ userInput }}</p>        {% # escaped %}
<div>{{ trustedHtml | raw }}</div>
```

## Advanced Usage

### Custom Options

`liquidOptions` accepts every [LiquidJS option](https://liquidjs.com/tutorials/options.html). It can be set globally in `forRoot`/`forRootAsync` or per call (per-call options replace the global ones, they are not merged):

```typescript
const pdf = await this.pdfService.generatePdfFromLiquidString(template, data, {
  liquidOptions: {
    strictVariables: true, // throw on undefined variables
    strictFilters: true, // throw on unknown filters
    locale: 'en-US', // locale used by the date filter
    timezoneOffset: 0, // render dates in UTC
  },
  pdfOptions: { format: 'A4' },
});
```

Commonly used options:

| Option            | Description                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------- |
| `root`            | Directories used to resolve `{% render %}`, `{% include %}` and `{% layout %}` templates |
| `partials`        | Directories for partials (defaults to `root`)                                            |
| `layouts`         | Directories for layouts (defaults to `root`)                                             |
| `extname`         | Extension appended to partial/layout names without one (e.g. `.liquid`)                  |
| `outputEscape`    | `'escape'` to escape every output, or a custom function                                  |
| `strictVariables` | Throw when a variable is undefined                                                       |
| `strictFilters`   | Throw when a filter is undefined                                                         |
| `globals`         | Variables available in every template                                                    |
| `jsTruthy`        | Use JavaScript truthiness (`''` and `0` are falsy) instead of Liquid's                   |
| `locale`          | Locale used by the `date` filter (defaults to the system locale)                         |
| `cache`           | Cache parsed partials/layouts. `false` also disables the service's file template cache   |

When options are provided, a dedicated Liquid instance is created for the call; otherwise a shared default instance is reused.

### Partials and Layouts

Partials and layouts are resolved from the `root` (or `partials` / `layouts`) directories. The template passed to `generatePdfFromLiquidFile` itself can live anywhere:

```text
templates/
├── invoice.liquid
├── layouts/
│   └── base.liquid
└── partials/
    └── header.liquid
```

```liquid
{% # templates/layouts/base.liquid %}
<html>
  <body>
    {% block content %}{% endblock %}
  </body>
</html>
```

```liquid
{% # templates/invoice.liquid %}
{% layout 'layouts/base' %}
{% block content %}
  {% render 'partials/header', title: title %}
  <p>Customer: {{ customerName | escape }}</p>
{% endblock %}
```

```typescript
await this.pdfService.generatePdfFromLiquidFile(
  'templates/invoice.liquid',
  { title: 'Invoice', customerName: 'Jane' },
  { liquidOptions: { root: ['templates'], extname: '.liquid' } },
);
```

> `{% render %}` runs the partial in an isolated scope: pass the variables it needs explicitly (`title: title`). `{% include %}` shares the parent scope.

### Caching

The Liquid service caches the content of file templates (up to 100 files). Pass `liquidOptions: { cache: false }` to always read the file from disk. You can also manage the cache by injecting `LiquidService`:

```typescript
import { LiquidService } from '@shad0wz7/nestjs-pdf';

constructor(private readonly liquidService: LiquidService) {}

// Clear cache when templates change
this.liquidService.clearCache();

// Get cache size
const cacheSize = this.liquidService.getCacheSize();
```

## Error Handling

- Rendering errors (syntax errors, unknown tags, `strictVariables` failures, missing files) throw a `TemplateRenderException` with `engine: 'Liquid'` and the original error as `cause`.
- If `liquidjs` is not installed, an `EngineNotAvailableException` (`ENGINE_NOT_AVAILABLE`) is thrown on first use.

See [Error handling](./ERROR_HANDLING.md) for details.

## Complete Example

A complete runnable example (string and file templates) is available in [`examples/liquid`](../examples/liquid).

### Template File (invoice.liquid)

```liquid
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
    <p><strong>Customer:</strong> {{ customerName | escape }}</p>
    <p><strong>Date:</strong> {{ date | date: "%Y-%m-%d" }}</p>

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
        {% for item in items %}
        <tr>
          <td>{{ item.name | escape }}</td>
          <td>{{ item.qty }}</td>
          <td>${{ item.unitPrice }}</td>
          <td>${{ item.unitPrice | times: item.qty | round: 2 }}</td>
        </tr>
        {% endfor %}
      </tbody>
    </table>

    <p class="total">Grand Total: ${{ grandTotal | round: 2 }}</p>
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
    return this.pdfService.generatePdfFromLiquidFile(
      'templates/invoice.liquid',
      {
        customerName: invoiceData.customer.name,
        date: new Date(),
        items: invoiceData.items,
        grandTotal: invoiceData.items.reduce(
          (sum, item) => sum + item.qty * item.unitPrice,
          0,
        ),
      },
    );
  }
}
```

### Controller

```typescript
import { Body, Controller, Post, Res } from '@nestjs/common';
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

1. **Escape untrusted data**: use `| escape` or `outputEscape: 'escape'`, Liquid does not escape by default
2. **Use `strictVariables` in development** to catch typos in variable names early
3. **Set `root`** so partials and layouts resolve independently of the process working directory
4. **Set `locale` / `timezoneOffset`** when formatting dates, so PDFs don't depend on the server settings
5. **Keep heavy computations in your service layer**: Liquid filters are great for formatting, not business logic
6. **Clear the cache** when templates change at runtime

## Comparison with Other Template Engines

| Feature              | Liquid     | Mustache    | Handlebars | Nunjucks | Eta     |
| -------------------- | ---------- | ----------- | ---------- | -------- | ------- |
| Syntax Complexity    | Simple     | Very Simple | Simple     | Medium   | Medium  |
| Logic Support        | Yes (safe) | No          | Limited    | Yes      | Full JS |
| Safe for user edits  | Yes        | Yes         | Yes        | Partial  | No      |
| Escapes by default   | No         | Yes         | Yes        | No       | Yes     |
| Template Inheritance | Yes        | No          | No         | Yes      | Yes     |
| Partials/Includes    | Yes        | Yes         | Yes        | Yes      | Yes     |

## Troubleshooting

### "Liquid engine is not available" Error

The `liquidjs` package is not installed. Install it with:

```bash
npm install liquidjs
```

### `ENOENT: Failed to lookup "..."` when using partials

The partial or layout is not found in the configured directories. Check that `root` (or `partials` / `layouts`) points to the right directory and that `extname` matches your file extension.

### Dates are in the wrong language or timezone

The `date` filter uses the system locale and timezone by default. Set `locale` and `timezoneOffset` in `liquidOptions`.

### HTML shows up as text

You enabled `outputEscape: 'escape'`: use the `raw` filter for trusted HTML (`{{ html | raw }}`).

## Additional Resources

- [LiquidJS Documentation](https://liquidjs.com/)
- [LiquidJS Options](https://liquidjs.com/tutorials/options.html)
- [Built-in Filters](https://liquidjs.com/filters/overview.html)
- [Built-in Tags](https://liquidjs.com/tags/overview.html)

## Support

For issues or questions related to Liquid integration with this library, please open an issue on the [GitHub repository](https://github.com/ShadowZ11/nestjs-pdf).
