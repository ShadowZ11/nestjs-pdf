import { join } from 'node:path';

import { Controller, Post, Res } from '@nestjs/common';
import { NestjsPdfService } from '@shad0wz7/nestjs-pdf';
import type { Response } from 'express';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: NestjsPdfService) {}

  /**
   * Generate a PDF from a Liquid template string
   */
  @Post('liquid/string')
  async generatePdfFromLiquidString(@Res() response: Response) {
    const template = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            .invoice { border: 1px solid #ccc; padding: 20px; }
            .item { margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>Invoice</h1>
          <div class="invoice">
            <p><strong>Customer:</strong> {{ customerName | escape }}</p>
            <p><strong>Invoice Date:</strong> {{ date | date: "%Y-%m-%d" }}</p>
            <h2>Items:</h2>
            {% for item in items %}
            <div class="item">
              <p>{{ forloop.index }}. {{ item.name }} - \${{ item.price }}</p>
            </div>
            {% endfor %}
            <hr />
            <p><strong>Total:</strong> \${{ items | map: "price" | sum | round: 2 }}</p>
          </div>
        </body>
      </html>
    `;

    const data = {
      customerName: 'John Doe',
      date: new Date(),
      items: [
        { name: 'Product A', price: 29.99 },
        { name: 'Product B', price: 49.99 },
        { name: 'Product C', price: 19.99 },
      ],
    };

    const pdf = await this.pdfService.generatePdfFromLiquidString(
      template,
      data,
    );

    response.type('application/pdf');
    response.send(pdf);
  }

  /**
   * Generate a PDF from a Liquid template file
   */
  @Post('liquid/file')
  async generatePdfFromLiquidFile(@Res() response: Response) {
    const items = [
      {
        name: 'Service A',
        description: 'Monthly maintenance',
        quantity: 1,
        unitPrice: 99.99,
      },
      {
        name: 'Service B',
        description: 'Support hours',
        quantity: 3,
        unitPrice: 49.99,
      },
    ];
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    const data = {
      customerName: 'Jane Smith',
      customerEmail: 'jane.smith@example.com',
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items,
      subtotal,
      taxPercent: 20,
      tax: subtotal * 0.2,
      notes: 'Payment by bank transfer.\nThank you!',
    };

    const pdf = await this.pdfService.generatePdfFromLiquidFile(
      join(__dirname, 'sample-template.liquid'),
      data,
      {
        // Directory used to resolve {% render %}, {% include %} and {% layout %}
        liquidOptions: {
          root: [__dirname],
          extname: '.liquid',
          locale: 'en-US',
        },
      },
    );

    response.type('application/pdf');
    response.send(pdf);
  }
}
