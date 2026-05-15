# EJS Template Support

This guide shows how to use EJS (Embedded JavaScript Templating) with nestjs-pdf to generate PDFs with dynamic content and JavaScript logic.

## Installation

EJS is already included as a dependency in this library.

## Usage

### Basic Setup

Configure EJS options in your NestJS application:

```typescript
import { Module } from '@nestjs/common';
import { NestjsPdfModule } from '@shad0wz7/nestjs-pdf';

@Module({
  imports: [
    NestjsPdfModule.forRoot({
      ejsOptions: {
        cache: false,          // Enable/disable caching
        // ... other EJS options
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

  // Generate PDF from EJS string
  async generateEjsPdf(): Promise<Uint8Array> {
    const ejsTemplate = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { color: #1abc9c; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #1abc9c; color: white; }
          </style>
        </head>
        <body>
          <h1><%= title %></h1>
          <p>Amount: $<%= amount %></p>
          
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
              <% items.forEach(item => { %>
              <tr>
                <td><%= item.name %></td>
                <td><%= item.quantity %></td>
                <td>$<%= item.price %></td>
                <td>$<%= item.total %></td>
              </tr>
              <% }); %>
            </tbody>
          </table>
          
          <% if (discountApplied) { %>
          <p><strong>A discount has been applied!</strong></p>
          <% } %>
        </body>
      </html>
    `;

    return this.pdfService.generatePdfFromEjsString(ejsTemplate, {
      title: 'Invoice',
      amount: 1100,
      items: [
        { name: 'Service A', quantity: 1, price: 500, total: 500 },
        { name: 'Service B', quantity: 2, price: 300, total: 600 },
      ],
      discountApplied: false,
    });
  }

  // Generate PDF from EJS file
  async generateEjsPdfFromFile(): Promise<Uint8Array> {
    return this.pdfService.generatePdfFromEjsFile(
      './templates/invoice.ejs',
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

### `generatePdfFromEjsString(template: string, data?: any, options?: PuppeteerParameters)`

Generates a PDF from an EJS template provided as a string.

**Parameters:**
- `template` (string): EJS template with HTML/CSS
- `data` (any): Data to inject into the template (optional)
- `options` (PuppeteerParameters): PDF generation options (optional)

**Returns:** `Promise<Uint8Array>` - The generated PDF as bytes

**Example:**
```typescript
const ejsTemplate = `<h1><%= name %></h1>`;
const pdf = await this.pdfService.generatePdfFromEjsString(
  ejsTemplate,
  { name: 'John' },
  { pdfOptions: { format: 'A4' } }
);
```

### `generatePdfFromEjsFile(file: string, data?: any, options?: PuppeteerParameters)`

Generates a PDF from an EJS template file.

**Parameters:**
- `file` (string): Path to the .ejs file
- `data` (any): Data to inject into the template (optional)
- `options` (PuppeteerParameters): PDF generation options (optional)

**Returns:** `Promise<Uint8Array>` - The generated PDF as bytes

**Example:**
```typescript
const pdf = await this.pdfService.generatePdfFromEjsFile(
  './templates/invoice.ejs',
  {
    customerName: 'John Doe',
    total: 1000,
  },
);
```

## EJS Features

EJS provides powerful templating features with a straightforward syntax:

- **Output escaped**: `<%= variable %>`
- **Output raw HTML**: `<%- html %>`
- **JavaScript code**: `<% javascript code %>`
- **Comments**: `<%# comment %>`
- **Conditionals**: `<% if (condition) { %> ... <% } %>`
- **Loops**: `<% items.forEach(item => { %> ... <% }); %>`
- **Include files**: `<%- include('file') %>`

### Common Syntax Examples

```ejs
<!-- Output escaped -->
<p><%= userName %></p>

<!-- Output raw HTML -->
<div><%- htmlContent %></div>

<!-- JavaScript code -->
<% const total = price * quantity; %>

<!-- Conditional -->
<% if (user.isAdmin) { %>
  <p>Welcome Admin!</p>
<% } else { %>
  <p>Welcome User!</p>
<% } %>

<!-- Loop -->
<% items.forEach(item => { %>
  <li><%= item.name %>: $<%= item.price %></li>
<% }); %>

<!-- For loop -->
<% for (let i = 0; i < 5; i++) { %>
  <p>Item <%= i %></p>
<% } %>

<!-- Include partial -->
<%- include('partials/header') %>

<!-- Comments -->
<%# This won't be rendered %>
```

## Comparison with Other Templating Engines

| Feature | EJS | Handlebars | MJML |
|---------|-----|-----------|------|
| JavaScript code | Yes | Limited | No |
| Simple syntax | Yes | Moderate | MJML markup |
| Dynamic content | Excellent | Good | Limited |
| Responsive design | Manual CSS | Manual CSS | Built-in |
| Learning curve | Easy | Easy | Moderate |
| Best for | Dynamic templates | Data binding | Email templates |

## Notes

- EJS templates support full JavaScript code execution
- Variables are escaped by default for security
- Use `<%- %>` to output raw HTML without escaping
- The `cache` option can improve performance in production
- Each data injection provides a fresh rendering

## Best Practices

1. **Security**: Always escape user input by default. Only use `<%- %>` for trusted content
2. **Performance**: Use caching in production environments
3. **Readability**: Keep templates clean and readable
4. **Reusability**: Use includes for common template parts
5. **Data structure**: Pass well-structured data objects to templates

### Example with includes and partials:

```ejs
<%- include('partials/header', {title: 'Invoice'}) %>

<div class="content">
  <p>Total: $<%= total %></p>
</div>

<%- include('partials/footer') %>
```

## Advanced Features

### Using Functions in Templates

```ejs
<% 
  const formatCurrency = (value) => `$${value.toFixed(2)}`;
  const today = new Date().toLocaleDateString();
%>

<p>Price: <%= formatCurrency(price) %></p>
<p>Date: <%= today %></p>
```

### Complex Data Processing

```ejs
<%
  const items = data.items;
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;
%>

<p>Subtotal: <%= subtotal %></p>
<p>Tax: <%= tax %></p>
<p>Total: <%= total %></p>
```

## Common Use Cases

- **Invoices**: Dynamic pricing and item lists
- **Reports**: Complex data processing and layout
- **Certificates**: Personalized content
- **Email templates**: Rich HTML content with dynamic data
- **Data sheets**: Tabular data with calculations

