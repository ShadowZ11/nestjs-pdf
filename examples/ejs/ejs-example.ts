/**
 * Example: Using EJS with nestjs-pdf
 *
 * This example demonstrates how to set up and use EJS templates
 * to generate PDFs with dynamic content in a NestJS application.
 */

import { Controller, Get, Res } from '@nestjs/common';
import { NestjsPdfService } from '@shad0wz7/nestjs-pdf';
import type { Response } from 'express';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: NestjsPdfService) {}

  @Get('ejs-example')
  async generateEjsPdf(@Res() res: Response) {
    try {
      // EJS template with dynamic data and JavaScript logic
      const ejsTemplate = `
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
              .discount-badge {
                display: inline-block;
                background-color: #e74c3c;
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                margin-left: 10px;
                font-size: 12px;
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
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Invoice #<%= number %></h1>
            </div>

            <div class="info-section">
              <p><strong>Company:</strong> <%= company %></p>
              <p><strong>Customer:</strong> <%= customer %></p>
              <p><strong>Email:</strong> <%= email %></p>
            </div>

            <div class="info-section">
              <p><strong>Invoice Date:</strong> <%= invoiceDate %></p>
              <p><strong>Due Date:</strong> <%= dueDate %></p>
              <p><strong>Status:</strong> <%= status %> <% if (discounted) { %><span class="discount-badge">DISCOUNTED</span><% } %></p>
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
                <% items.forEach(item => { %>
                <tr>
                  <td><%= item.name %></td>
                  <td><%= item.description %></td>
                  <td><%= item.quantity %></td>
                  <td>$<%= item.price %></td>
                  <td>$<%= item.total %></td>
                </tr>
                <% }); %>
              </tbody>
            </table>

            <%
              // Calculate totals using JavaScript
              const subtotal = items.reduce((sum, item) => sum + item.total, 0);
              const taxRate = 0.10;
              const taxAmount = subtotal * taxRate;
              const discountAmount = discounted ? subtotal * 0.15 : 0;
              const finalTotal = subtotal + taxAmount - discountAmount;
            %>

            <div class="total-section">
              <p><strong>Subtotal:</strong> $<%= subtotal.toFixed(2) %></p>
              <p><strong>Tax (10%):</strong> $<%= taxAmount.toFixed(2) %></p>
              <% if (discounted) { %>
              <p><strong>Discount (15%):</strong> -$<%= discountAmount.toFixed(2) %></p>
              <% } %>
              <p class="total-amount"><strong>Total Amount Due:</strong> $<%= finalTotal.toFixed(2) %></p>
            </div>

            <% if (notes) { %>
            <div class="info-section">
              <h3>Notes</h3>
              <p><%= notes %></p>
            </div>
            <% } %>

            <div class="footer">
              <p>Thank you for your business!</p>
              <p>For questions, please contact support@example.com</p>
              <p>Generated on <%= generatedDate %></p>
            </div>
          </body>
        </html>
      `;

      // Sample data with dynamic calculations
      const invoiceData = {
        number: '2024-EJS-001',
        company: 'Tech Solutions Inc.',
        customer: 'Alice Johnson',
        email: 'alice.johnson@company.com',
        invoiceDate: '2024-05-12',
        dueDate: '2024-06-12',
        status: 'Pending',
        discounted: true,
        items: [
          {
            name: 'Web Development',
            description: 'Full-stack web application development (40 hours)',
            quantity: 40,
            price: 150,
            total: 6000,
          },
          {
            name: 'UI/UX Design',
            description: 'Mobile app interface design (20 hours)',
            quantity: 20,
            price: 100,
            total: 2000,
          },
          {
            name: 'Project Management',
            description: 'Project planning and management (10 hours)',
            quantity: 10,
            price: 120,
            total: 1200,
          },
        ],
        notes:
          'Payment terms: Net 30 days. Please remit payment to the invoice address. Thank you!',
        generatedDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      // Generate PDF from EJS template
      const pdfBuffer = await this.pdfService.generatePdfFromEjsString(
        ejsTemplate,
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
        'Content-Disposition': 'attachment; filename="invoice-ejs.pdf"',
      });

      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).send('Error generating PDF');
    }
  }

  @Get('ejs-file-example')
  async generateEjsPdfFromFile(@Res() res: Response) {
    try {
      // Sample data for file-based template
      const invoiceData = {
        number: '2024-EJS-002',
        company: 'Digital Agency Ltd.',
        customer: 'Bob Smith',
        email: 'bob.smith@agency.com',
        invoiceDate: '2024-05-15',
        dueDate: '2024-06-15',
        status: 'Paid',
        discounted: false,
        items: [
          {
            name: 'Branding Design',
            description: 'Logo and brand identity design',
            quantity: 1,
            price: 3000,
            total: 3000,
          },
          {
            name: 'Website Design',
            description: 'Responsive website design (5 pages)',
            quantity: 5,
            price: 800,
            total: 4000,
          },
          {
            name: 'Copywriting',
            description: 'Professional copywriting engines',
            quantity: 1,
            price: 1500,
            total: 1500,
          },
        ],
        notes: 'Thank you for your continued partnership!',
        generatedDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      };

      // Generate PDF from EJS file
      const pdfBuffer = await this.pdfService.generatePdfFromEjsFile(
        './templates/invoice.ejs',
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
        'Content-Disposition': 'attachment; filename="invoice-ejs-file.pdf"',
      });

      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).send('Error generating PDF');
    }
  }
}

// See ./app.module.ts and ./main.ts for a runnable NestJS app wiring this controller.
