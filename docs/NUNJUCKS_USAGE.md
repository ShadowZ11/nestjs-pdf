# Nunjucks Template Engine Usage

This document explains how to use the **Nunjucks** template engine with the `@shad0wz7/nestjs-pdf` library to generate PDFs.

## Overview

Nunjucks is a powerful and flexible templating language with a syntax similar to Jinja2. It provides advanced features like inheritance, macros, filters, and more, making it ideal for complex document generation.

**Key Features:**
- Template inheritance for code reuse
- Macros for reusable template snippets
- Powerful filters for data transformation
- Conditional logic and loops
- Automatic escaping by default
- Simple, readable syntax

## Installation

The Nunjucks dependency is already included in `@shad0wz7/nestjs-pdf`.

## Setup

### 1. Import the Module

In your NestJS application module:

```typescript
import { Module } from '@nestjs/common';
import { NestjsPdfModule } from '@shad0wz7/nestjs-pdf';

@Module({
  imports: [
    NestjsPdfModule.forRoot({
      nunjucksOptions: {
        noCache: true,
        trimBlocks: true,
        lstripBlocks: true,
      },
    }),
  ],
})
export class AppModule {}
```

### 2. Inject the Service

In your NestJS service or controller:

```typescript
import { Injectable } from '@nestjs/common';
import { NestjsPdfService } from '@shad0wz7/nestjs-pdf';

@Injectable()
export class PdfExportService {
  constructor(private readonly pdfService: NestjsPdfService) {}
}
```

## Usage Examples

### Example 1: Generate PDF from Nunjucks Template String

```typescript
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { NestjsPdfService } from '@shad0wz7/nestjs-pdf';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: NestjsPdfService) {}

  @Get('nunjucks-example')
  async generatePdfFromNunjucksString(@Res() res: Response) {
    const template = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .invoice { border: 1px solid #ddd; padding: 20px; }
            .header { font-weight: bold; font-size: 18px; margin-bottom: 10px; }
            .item { margin: 10px 0; }
            .total { font-weight: bold; margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">Invoice #{{ invoiceNumber }}</div>
            <p><strong>Customer:</strong> {{ customerName }}</p>
            
            <h3>Items:</h3>
            {% for item in items %}
              <div class="item">
                {{ item.name }} - Qty: {{ item.quantity }} x ${{ item.price }} = ${{ item.total }}
              </div>
            {% endfor %}
            
            <div class="total">Total: ${{ totalAmount }}</div>
            
            {% if notes %}
              <p><strong>Notes:</strong> {{ notes }}</p>
            {% endif %}
          </div>
        </body>
      </html>
    `;

    const data = {
      invoiceNumber: 'INV-2024-001',
      customerName: 'John Doe',
      items: [
        { name: 'Service A', quantity: 2, price: 100, total: 200 },
        { name: 'Service B', quantity: 1, price: 150, total: 150 },
      ],
      totalAmount: 350,
      notes: 'Thank you for your business!',
    };

    const pdfBytes = await this.pdfService.generatePdfFromNunjucksString(template, data);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="invoice.pdf"',
    });
    res.send(pdfBytes);
  }
}
```

### Example 2: Generate PDF from Nunjucks Template File

First, create a template file (e.g., `templates/invoice.njk`):

```nunjucks
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; }
      .invoice { padding: 20px; }
    </style>
  </head>
  <body>
    <div class="invoice">
      <h1>Invoice</h1>
      <p>Invoice #: {{ invoiceNumber }}</p>
      <p>Date: {{ date | date('YYYY-MM-DD') }}</p>
      
      <h3>Items:</h3>
      <ul>
      {% for item in items %}
        <li>{{ item.name }} - ${{ item.price }}</li>
      {% endfor %}
      </ul>
    </div>
  </body>
</html>
```

Then use it in your controller:

```typescript
@Get('nunjucks-file-example')
async generatePdfFromNunjucksFile(@Res() res: Response) {
  const data = {
    invoiceNumber: 'INV-2024-001',
    date: new Date(),
    items: [
      { name: 'Service A', price: 100 },
      { name: 'Service B', price: 150 },
    ],
  };

  const pdfBytes = await this.pdfService.generatePdfFromNunjucksFile(
    'templates/invoice.njk',
    data,
  );

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="invoice.pdf"',
  });
  res.send(pdfBytes);
}
```

## Nunjucks Template Syntax Reference

### Variables

```nunjucks
{{ variableName }}
{{ object.property }}
{{ array[0] }}
```

### Filters

```nunjucks
{{ text | upper }}
{{ text | lower }}
{{ text | capitalize }}
{{ number | round(2) }}
{{ date | date('YYYY-MM-DD') }}
{{ array | length }}
{{ text | replace('old', 'new') }}
```

### Conditionals

```nunjucks
{% if condition %}
  <p>Condition is true</p>
{% elif otherCondition %}
  <p>Other condition is true</p>
{% else %}
  <p>No conditions are true</p>
{% endif %}
```

### Loops

```nunjucks
{% for item in items %}
  <p>{{ item.name }}</p>
{% endfor %}

{% for item in items %}
  <p>{{ loop.index }}: {{ item.name }}</p>
{% endfor %}
```

Loop variables:
- `loop.index` - Current iteration (1-indexed)
- `loop.index0` - Current iteration (0-indexed)
- `loop.first` - True if first iteration
- `loop.last` - True if last iteration
- `loop.length` - Total length of the array

### Template Inheritance

**base.njk:**
```nunjucks
<!DOCTYPE html>
<html>
  <head>
    <title>{% block title %}Default Title{% endblock %}</title>
  </head>
  <body>
    <div id="content">
      {% block content %}{% endblock %}
    </div>
  </body>
</html>
```

**child.njk:**
```nunjucks
{% extends "base.njk" %}

{% block title %}My Page{% endblock %}

{% block content %}
  <h1>Welcome!</h1>
  <p>This is the content</p>
{% endblock %}
```

### Macros

```nunjucks
{% macro renderItem(name, price) %}
  <div>{{ name }} - ${{ price }}</div>
{% endmacro %}

{{ renderItem('Item A', 100) }}
{{ renderItem('Item B', 150) }}
```

## Configuration Options

You can customize Nunjucks behavior through `nunjucksOptions`:

```typescript
NestjsPdfModule.forRoot({
  nunjucksOptions: {
    noCache: true,           // Disable template caching
    watch: false,            // Watch for template changes
    throwOnUndefined: false, // Throw error on undefined variables
    trimBlocks: true,        // Remove first newline after block tags
    lstripBlocks: true,      // Remove leading whitespace before tags
  },
})
```

## Best Practices

1. **Use Template Files for Complex Templates**: For large or frequently used templates, store them in files rather than inline strings.

2. **Leverage Inheritance**: Use template inheritance to avoid code duplication and maintain consistency across documents.

3. **Sanitize User Input**: Always ensure user input is properly escaped to prevent injection attacks. Nunjucks does this by default.

4. **Use Macros for Reusable Components**: Create macros for components that repeat throughout your templates.

5. **Optimize Performance**: Disable caching during development (`noCache: true`) but enable it in production for better performance.

## Comparison with Other Template Engines

| Feature | Nunjucks | EJS | Pug | Handlebars |
|---------|----------|-----|-----|-----------|
| **Syntax Style** | Jinja2-like | JavaScript | Python-like | Minimal |
| **Inheritance** | ✓ | ✗ | ✓ | ✗ |
| **Macros** | ✓ | ✗ | ✓ | Helpers |
| **Filters** | ✓ | ✓ | ✗ | ✓ |
| **Async Support** | ✓ | ✓ | ✗ | ✗ |
| **Learning Curve** | Moderate | Easy | Moderate | Easy |
| **Best For** | Complex templates | Flexible logic | Clean syntax | Simple templates |

## Troubleshooting

### Template Not Found

If you get a "template not found" error, ensure the path is relative to your project root or use an absolute path.

### Variables Not Rendering

Make sure:
- Variable names match exactly (case-sensitive)
- Data object is properly passed
- Variable is not `undefined` (use filters or defaults)

### Performance Issues

- Enable caching in production: `noCache: false`
- Use async filters sparingly
- Pre-compile templates if possible

## Additional Resources

- [Nunjucks Documentation](https://mozilla.github.io/nunjucks/)
- [Mozilla Nunjucks GitHub](https://github.com/mozilla/nunjucks)
- [Template Syntax Guide](https://mozilla.github.io/nunjucks/templating.html)

