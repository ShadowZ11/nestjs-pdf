/**
 * Example: Using Handlebars with nestjs-pdf
 *
 * This example demonstrates how to set up and use Handlebars templates
 * to generate PDFs with dynamic content in a NestJS application.
 */

import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { NestjsPdfService } from '../src/nestjs-pdf.service';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: NestjsPdfService) {}

  @Get('handlebars-example')
  async generateHandlebarsPdf(@Res() res: Response) {
    try {
      // Handlebars template with dynamic data
      const handlebarsTemplate = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: #333;
                line-height: 1.6;
              }
              .header {
                background-color: #1abc9c;
                color: white;
                padding: 20px;
                border-radius: 5px;
                margin-bottom: 20px;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
              }
              .info-section {
                margin-bottom: 20px;
                padding: 15px;
                background-color: #f9f9f9;
                border-left: 4px solid #1abc9c;
              }
              .info-section p {
                margin: 5px 0;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              th {
                background-color: #1abc9c;
                color: white;
                padding: 12px;
                text-align: left;
              }
              td {
                padding: 10px 12px;
                border-bottom: 1px solid #ddd;
              }
              tr:hover {
                background-color: #f5f5f5;
              }
              .total-section {
                margin-top: 20px;
                padding: 15px;
                background-color: #f0f0f0;
                border-radius: 5px;
              }
              .total-amount {
                font-size: 18px;
                font-weight: bold;
                color: #1abc9c;
              }
              .footer {
                margin-top: 30px;
                padding-top: 15px;
                border-top: 1px solid #ddd;
                font-size: 12px;
                color: #666;
                text-align: center;
              }
              @media print {
                body { font-size: 12pt; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Invoice #{{invoiceNumber}}</h1>
            </div>

            <div class="info-section">
              <p><strong>Customer Name:</strong> {{customerName}}</p>
              <p><strong>Email:</strong> {{customerEmail}}</p>
              <p><strong>Company:</strong> {{company}}</p>
            </div>

            <div class="info-section">
              <p><strong>Invoice Date:</strong> {{invoiceDate}}</p>
              <p><strong>Due Date:</strong> {{dueDate}}</p>
              <p><strong>Status:</strong> {{status}}</p>
            </div>

            <h2>Order Details</h2>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {{#each items}}
                <tr>
                  <td>{{this.name}}</td>
                  <td>{{this.description}}</td>
                  <td>{{this.quantity}}</td>
                  <td>\${{this.price}}</td>
                  <td>\${{this.total}}</td>
                </tr>
                {{/each}}
              </tbody>
            </table>

            <div class="total-section">
              <p><strong>Subtotal:</strong> \${{subtotal}}</p>
              <p><strong>Tax ({{taxRate}}%):</strong> \${{taxAmount}}</p>
              <p class="total-amount"><strong>Total Amount Due:</strong> \${{totalAmount}}</p>
            </div>

            {{#if notes}}
            <div class="info-section">
              <h3>Notes</h3>
              <p>{{notes}}</p>
            </div>
            {{/if}}

            <div class="footer">
              <p>Thank you for your business!</p>
              <p>For questions, please contact us at support@example.com</p>
              <p>Generated on {{generatedDate}}</p>
            </div>
          </body>
        </html>
      `;

      // Sample data to inject into the template
      const invoiceData = {
        invoiceNumber: '2024-001',
        customerName: 'Jane Smith',
        customerEmail: 'jane.smith@example.com',
        company: 'Acme Corporation',
        invoiceDate: '2024-05-12',
        dueDate: '2024-06-12',
        status: 'Pending',
        items: [
          {
            name: 'Web Development',
            description: 'Full-stack web application development',
            quantity: 40,
            price: 150,
            total: 6000,
          },
          {
            name: 'UI/UX Design',
            description: 'Mobile app interface design',
            quantity: 20,
            price: 100,
            total: 2000,
          },
          {
            name: 'Consulting',
            description: 'Technical architecture consultation',
            quantity: 10,
            price: 200,
            total: 2000,
          },
        ],
        subtotal: 10000,
        taxRate: 10,
        taxAmount: 1000,
        totalAmount: 11000,
        notes:
          'Payment terms: Net 30 days. Please remit payment to the invoice address.',
        generatedDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      };

      // Generate PDF from Handlebars template
      const pdfBuffer = await this.pdfService.generatePdfFromTemplateString(
        handlebarsTemplate,
        invoiceData,
        {
          pdfOptions: {
            format: 'A4',
            margin: {
              top: '15mm',
              right: '15mm',
              bottom: '15mm',
              left: '15mm',
            },
          },
        },
      );

      // Set response headers
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.length,
        'Content-Disposition': 'attachment; filename="invoice.pdf"',
      });

      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).send('Error generating PDF');
    }
  }

  @Get('handlebars-file-example')
  async generateHandlebarsPdfFromFile(@Res() res: Response) {
    try {
      // Sample data to inject into the template file
      const invoiceData = {
        invoiceNumber: '2024-002',
        customerName: 'John Doe',
        customerEmail: 'john.doe@example.com',
        company: 'Tech Solutions Inc.',
        invoiceDate: '2024-05-15',
        dueDate: '2024-06-15',
        status: 'Paid',
        items: [
          {
            name: 'Hosting Services',
            description: 'Cloud server hosting (12 months)',
            quantity: 1,
            price: 2400,
            total: 2400,
          },
          {
            name: 'Support Package',
            description: '24/7 technical support',
            quantity: 12,
            price: 200,
            total: 2400,
          },
        ],
        subtotal: 4800,
        taxRate: 8,
        taxAmount: 384,
        totalAmount: 5184,
        notes: 'Thank you for your continued partnership!',
        generatedDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      };

      // Generate PDF from Handlebars file
      const pdfBuffer = await this.pdfService.generatePdfFromTemplateFile(
        './templates/invoice.hbs',
        invoiceData,
        {
          pdfOptions: {
            format: 'A4',
            margin: {
              top: '15mm',
              right: '15mm',
              bottom: '15mm',
              left: '15mm',
            },
          },
        },
      );

      // Set response headers
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.length,
        'Content-Disposition': 'attachment; filename="invoice.pdf"',
      });

      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).send('Error generating PDF');
    }
  }
}

/**
 * Module setup example:
 *
 * import { Module } from '@nestjs/common';
 * import { PdfController } from './pdf.controller';
 * import { NestjsPdfModule } from '@shad0wz7/nestjs-pdf';
 *
 * @Module({
 *   imports: [
 *     NestjsPdfModule.forRoot({
 *       hbsOptions: {
 *         viewsDir: './templates',
 *         extname: '.hbs',
 *       },
 *     })
 *   ],
 *   controllers: [PdfController],
 * })
 * export class AppModule {}
 */
