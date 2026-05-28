import { Controller, Post, Res } from '@nestjs/common';
import { NestjsPdfService } from '@shad0wz7/nestjs-pdf';
import type { Response } from 'express';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: NestjsPdfService) {}

  /**
   * Generate a PDF from an Eta template string
   */
  @Post('eta/string')
  async generatePdfFromEtaString(@Res() response: Response) {
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
            <p><strong>Customer:</strong> <%= it.customerName %></p>
            <p><strong>Invoice Date:</strong> <%= it.date %></p>
            <h2>Items:</h2>
            <% it.items.forEach(item => { %>
            <div class="item">
              <p><%= item.name %> - $<%= item.price %></p>
            </div>
            <% }) %>
            <hr />
            <p><strong>Total:</strong> $<%= it.total %></p>
          </div>
        </body>
      </html>
    `;

    const data = {
      customerName: 'John Doe',
      date: new Date().toLocaleDateString(),
      items: [
        { name: 'Product A', price: '29.99' },
        { name: 'Product B', price: '49.99' },
        { name: 'Product C', price: '19.99' },
      ],
      total: '99.97',
    };

    const pdf = await this.pdfService.generatePdfFromEtaString(template, data);

    response.type('application/pdf');
    response.send(pdf);
  }

  /**
   * Generate a PDF from an Eta template file
   */
  @Post('eta/file')
  async generatePdfFromEtaFile(@Res() response: Response) {
    const data = {
      customerName: 'Jane Smith',
      date: new Date().toLocaleDateString(),
      items: [
        { name: 'Service A', price: '99.99' },
        { name: 'Service B', price: '149.99' },
      ],
      total: '249.98',
    };

    const pdf = await this.pdfService.generatePdfFromEtaFile(
      'path/to/sample-template.eta',
      data,
    );

    response.type('application/pdf');
    response.send(pdf);
  }
}
