/**
 * Example: Using Pug with nestjs-pdf
 *
 * This example demonstrates how to set up and use Pug templates
 * to generate PDFs in a NestJS application.
 */

import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { NestjsPdfService } from '@shad0wz7/nestjs-pdf';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: NestjsPdfService) {}

  @Get('pug-example')
  async generatePugPdf(@Res() res: Response) {
    try {
      // Pug template with dynamic data
      const pugTemplate = `
        doctype html
        html
          head
            meta(charset="UTF-8")
            style
              | * {
              |   margin: 0;
              |   padding: 0;
              |   box-sizing: border-box;
              | }
              | body {
              |   font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              |   color: #333;
              |   line-height: 1.6;
              | }
              | .header {
              |   background: linear-gradient(135deg, #1abc9c 0%, #16a085 100%);
              |   color: white;
              |   padding: 30px 20px;
              |   margin-bottom: 20px;
              | }
              | .header h1 {
              |   font-size: 28px;
              |   margin-bottom: 5px;
              | }
              | .info-section {
              |   margin-bottom: 20px;
              |   padding: 15px;
              |   background-color: #f9f9f9;
              |   border-left: 4px solid #1abc9c;
              | }
              | .info-section p {
              |   margin: 5px 0;
              | }
              | table {
              |   width: 100%;
              |   border-collapse: collapse;
              |   margin: 20px 0;
              | }
              | th {
              |   background-color: #1abc9c;
              |   color: white;
              |   padding: 12px;
              |   text-align: left;
              | }
              | td {
              |   padding: 10px 12px;
              |   border-bottom: 1px solid #ddd;
              | }
              | tr:hover {
              |   background-color: #f5f5f5;
              | }
              | .total-section {
              |   margin-top: 20px;
              |   padding: 15px;
              |   background-color: #f0f0f0;
              |   border-radius: 5px;
              | }
              | .total-amount {
              |   font-size: 18px;
              |   font-weight: bold;
              |   color: #1abc9c;
              | }
              | .footer {
              |   margin-top: 30px;
              |   padding-top: 15px;
              |   border-top: 1px solid #ddd;
              |   font-size: 12px;
              |   color: #666;
              |   text-align: center;
              | }
          body
            .header
              h1 Invoice ##{invoiceNumber}
            
            .info-section
              p
                strong Company:
                = company
              p
                strong Customer:
                = customer
              p
                strong Email:
                = email
            
            .info-section
              p
                strong Invoice Date:
                = invoiceDate
              p
                strong Due Date:
                = dueDate
              p
                strong Status:
                = status
            
            h2 Order Details
            table
              thead
                tr
                  th Item
                  th Description
                  th Qty
                  th Unit Price
                  th Total
              tbody
                each item in items
                  tr
                    td= item.name
                    td= item.description
                    td(style="text-align: right")= item.quantity
                    td(style="text-align: right; color: #1abc9c; font-weight: bold")
                      | $#{item.price}
                    td(style="text-align: right; color: #1abc9c; font-weight: bold")
                      | $#{item.total}
            
            .total-section
              div(style="display: flex; justify-content: flex-end; width: 100%;")
                div(style="width: 50%;")
                  div(style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #ddd;")
                    span Subtotal:
                    span(style="color: #1abc9c; font-weight: bold")
                      | $#{subtotal.toFixed(2)}
                  div(style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #ddd;")
                    span(style="font-weight: bold;")
                      | Tax (10%):
                    span(style="color: #1abc9c; font-weight: bold")
                      | $#{taxAmount.toFixed(2)}
                  if discounted
                    div(style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #ddd;")
                      span Discount (15%):
                      span(style="color: #1abc9c; font-weight: bold")
                        | -$#{discountAmount.toFixed(2)}
                  div(style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #1abc9c;")
                    span TOTAL DUE:
                    span $#{finalTotal.toFixed(2)}
            
            if notes
              .info-section
                h3 Notes
                p= notes
            
            .footer
              p Strong Thank you for your business!
              p For questions, please contact support@example.com
              p(style="margin-top: 10px;")
                | Generated on #{generatedDate}
      `;

      // Sample data for the template
      const invoiceData = {
        invoiceNumber: '2024-PUG-001',
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
        subtotal: 9200,
        taxAmount: 920,
        discountAmount: 1380,
        finalTotal: 8740,
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

      // Generate PDF from Pug template
      const pdfBuffer = await this.pdfService.generatePdfFromPugString(
        pugTemplate,
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
        'Content-Disposition': 'attachment; filename="invoice-pug.pdf"',
      });

      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).send('Error generating PDF');
    }
  }

  @Get('pug-file-example')
  async generatePugPdfFromFile(@Res() res: Response) {
    try {
      // Sample data for file-based template
      const invoiceData = {
        invoiceNumber: '2024-PUG-002',
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
        subtotal: 8500,
        taxAmount: 850,
        discountAmount: 0,
        finalTotal: 9350,
        notes: 'Thank you for your continued partnership!',
        generatedDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      };

      // Generate PDF from Pug file
      const pdfBuffer = await this.pdfService.generatePdfFromPugFile(
        './templates/invoice.pug',
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
        'Content-Disposition': 'attachment; filename="invoice-pug-file.pdf"',
      });

      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).send('Error generating PDF');
    }
  }
}

// See ./app.module.ts and ./main.ts for a runnable NestJS app wiring this controller.
