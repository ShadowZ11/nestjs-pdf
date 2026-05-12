# Pug Template Support

This guide shows how to use Pug templates with nestjs-pdf to generate PDFs with clean, indentation-based HTML syntax.

## Installation

Pug is already included as a dependency in this library.

## Usage

### Basic Setup

Configure Pug options in your NestJS application:

```typescript
import { Module } from '@nestjs/common';
import { NestjsPdfModule } from '@shad0wz7/nestjs-pdf';

@Module({
  imports: [
    NestjsPdfModule.forRoot({
      pugOptions: {
        pretty: false,     // Format output HTML
        doctype: 'html',   // Define doctype (default: html)
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

  // Generate PDF from Pug string
  async generatePugPdf(): Promise<Uint8Array> {
    const pugTemplate = `
      html
        head
          style
            | body { font-family: Arial, sans-serif; }
            | h1 { color: #1abc9c; }
            | table { border-collapse: collapse; width: 100%; }
            | th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            | th { background-color: #1abc9c; color: white; }
        body
          h1= title
          p Amount: $#{amount}
          
          table
            thead
              tr
                th Item
                th Quantity
                th Price
                th Total
            tbody
              each item in items
                tr
                  td= item.name
                  td= item.quantity
                  td $#{item.price}
                  td $#{item.total}
          
          if discountApplied
            p
              strong A discount has been applied!
    `;

    return this.pdfService.generatePdfFromPugString(pugTemplate, {
      title: 'Invoice',
      amount: 1100,
      items: [
        { name: 'Service A', quantity: 1, price: 500, total: 500 },
        { name: 'Service B', quantity: 2, price: 300, total: 600 },
      ],
      discountApplied: false,
    });
  }

  // Generate PDF from Pug file
  async generatePugPdfFromFile(): Promise<Uint8Array> {
    return this.pdfService.generatePdfFromPugFile(
      './templates/invoice.pug',
      {
        title: 'Invoice',
        amount: 1100,
        items: [
          { name: 'Service A', quantity: 1, price: 500, total: 500 },
          { name: 'Service B', quantity: 2, price: 300, total: 600 },
        ],
        discountApplied: true,
      },
    );
  }
}
```

## API Methods

### `generatePdfFromPugString(template: string, data?: any, options?: PuppeteerParameters)`

Generates a PDF from a Pug template provided as a string.

**Parameters:**
- `template` (string): Pug template
- `data` (any): Data to inject into the template (optional)
- `options` (PuppeteerParameters): PDF generation options (optional)

**Returns:** `Promise<Uint8Array>` - The generated PDF as bytes

**Example:**
```typescript
const pugTemplate = `h1= name`;
const pdf = await this.pdfService.generatePdfFromPugString(
  pugTemplate,
  { name: 'John' },
  { pdfOptions: { format: 'A4' } }
);
```

### `generatePdfFromPugFile(file: string, data?: any, options?: PuppeteerParameters)`

Generates a PDF from a Pug template file.

**Parameters:**
- `file` (string): Path to the .pug file
- `data` (any): Data to inject into the template (optional)
- `options` (PuppeteerParameters): PDF generation options (optional)

**Returns:** `Promise<Uint8Array>` - The generated PDF as bytes

**Example:**
```typescript
const pdf = await this.pdfService.generatePdfFromPugFile(
  './templates/invoice.pug',
  {
    customerName: 'John Doe',
    total: 1000,
  },
);
```

## Pug Features

Pug provides a clean, whitespace-sensitive syntax for writing HTML:

- **Text interpolation**: `= variable` or `#{variable}`
- **Iteration**: `each item in array ... `
- **Conditionals**: `if condition ... else ...`
- **Attributes**: `a(href="#") Link`
- **Classes**: `.classname`
- **IDs**: `#idname`
- **Raw text**: `| Text content`
- **Comments**: `//- Hidden comment` or `// Visible comment`

### Common Syntax Examples

```pug
//- Output variable
h1= title

//- String interpolation
p Hello #{name}!

//- Attributes
a(href="http://example.com" class="link") Click here
input(type="text" placeholder="Enter name")

//- Classes and IDs
div.container#main

//- Conditional
if isAdmin
  p Admin panel
else
  p User dashboard

//- Loop
ul
  each item in items
    li= item

//- Inline styles
style
  | body { color: red; }
  | h1 { font-size: 28px; }

//- Nested structure
div.card
  div.card-header
    h2= cardTitle
  div.card-body
    p= cardContent
  div.card-footer
    button Submit

//- Mixed content
p
  | This is text with
  strong bold
  | and more text
```

## Comparison with Other Templating Engines

| Feature | Pug | Handlebars | EJS | MJML |
|---------|-----|-----------|-----|------|
| Whitespace syntax | Yes | No | No | No |
| Clean indentation | Excellent | Moderate | Moderate | N/A |
| JavaScript code | Limited | Limited | Full | No |
| Dynamic content | Good | Good | Excellent | Limited |
| Learning curve | Moderate | Easy | Easy | Moderate |
| Best for | Clean templates | Data binding | Complex logic | Email |

## Notes

- Pug uses indentation to define structure (similar to Python)
- Variables are output without escaping by default
- Raw HTML can be embedded using the `|` character
- Pug compiles to standard HTML at runtime
- Each data injection provides a fresh compilation

## Best Practices

1. **Indentation**: Use consistent 2-space indentation
2. **Readability**: Keep template structure clear and hierarchical
3. **Reusability**: Use includes for common sections
4. **Variable naming**: Use descriptive names for template variables
5. **Organization**: Group related markup together

### Example with includes:

```pug
include header.pug

div.content
  h1= pageTitle
  p= pageContent

include footer.pug
```

## Advanced Features

### Using Functions in Pug

```pug
- const formatCurrency = (value) => `$${value.toFixed(2)}`;
- const today = new Date().toLocaleDateString();

p Price: #{formatCurrency(price)}
p Date: #{today}
```

### Complex Data Processing

```pug
-
  const items = data.items;
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

p Subtotal: #{subtotal}
p Tax: #{tax}
p Total: #{total}
```

### Mixins (Reusable Blocks)

```pug
mixin invoiceItem(name, quantity, price)
  tr
    td= name
    td= quantity
    td $#{price}

table
  each item in items
    +invoiceItem(item.name, item.qty, item.price)
```

## Common Use Cases

- **Invoices**: Clean, professional document layout
- **Certificates**: Personalized content with clean design
- **Reports**: Structured data presentation
- **Email templates**: Responsive layout with minimal markup
- **Documents**: Multi-page PDFs with consistent styling

## Tips for PDF Generation

1. **Print CSS**: Use `@media print` for PDF-specific styling
2. **Avoid floats**: Prefer flexbox or grid for layout
3. **Font sizes**: Use `pt` for print (e.g., `12pt`)
4. **Colors**: Test color output on actual PDFs
5. **Page breaks**: Use CSS `page-break-after` property

### Example with print CSS:

```pug
head
  style
    | body { font-family: Arial; font-size: 12pt; }
    | @media print {
    |   body { margin: 0; padding: 10mm; }
    |   .no-print { display: none; }
    |   .page-break { page-break-after: always; }
    | }

body
  div.page-1
    h1 Page 1
  div.page-break
  div.page-2
    h1 Page 2
```

