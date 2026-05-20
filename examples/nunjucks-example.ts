import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { NestjsPdfService } from '@shad0wz7/nestjs-pdf';

@Controller('pdf')
export class NunjucksPdfExampleController {
  constructor(private readonly pdfService: NestjsPdfService) {}

  /**
   * Generate a PDF from a Nunjucks template string
   */
  @Get('nunjucks-example')
  async generatePdfFromNunjucksString(@Res() res: Response) {
    const template = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @page {
              margin: 20px;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #333;
            }
            .container {
              max-width: 900px;
              margin: 0 auto;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 5px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .invoice-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              background: #f5f5f5;
              padding: 15px;
              border-radius: 5px;
            }
            .info-block {
              flex: 1;
            }
            .info-block label {
              font-weight: bold;
              color: #667eea;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 30px 0;
            }
            table thead {
              background-color: #667eea;
              color: white;
            }
            table th {
              padding: 12px;
              text-align: left;
              font-weight: 600;
            }
            table td {
              padding: 10px 12px;
              border-bottom: 1px solid #ddd;
            }
            table tbody tr:hover {
              background-color: #f9f9f9;
            }
            .total-section {
              text-align: right;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 2px solid #667eea;
            }
            .total-amount {
              font-size: 24px;
              font-weight: bold;
              color: #667eea;
            }
            .notes {
              margin-top: 30px;
              padding: 15px;
              background-color: #f0f4ff;
              border-left: 4px solid #667eea;
              border-radius: 3px;
            }
            .notes h3 {
              margin-top: 0;
              color: #667eea;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #999;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Invoice</h1>
            </div>

            <div class="invoice-info">
              <div class="info-block">
                <label>Invoice Number:</label>
                <p>{{ invoiceNumber }}</p>
              </div>
              <div class="info-block">
                <label>Date:</label>
                <p>{{ date }}</p>
              </div>
              <div class="info-block">
                <label>Due Date:</label>
                <p>{{ dueDate }}</p>
              </div>
            </div>

            <div class="invoice-info">
              <div class="info-block">
                <label>Bill To:</label>
                <p>
                  <strong>{{ customerName }}</strong><br/>
                  {{ customerEmail }}<br/>
                  {{ customerPhone }}
                </p>
              </div>
              <div class="info-block">
                <label>From:</label>
                <p>
                  <strong>Your Company</strong><br/>
                  support@yourcompany.com<br/>
                  +1 (555) 000-0000
                </p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {% for item in items %}
                  <tr>
                    <td>{{ item.name }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>${{ item.price | round(2) }}</td>
                    <td>${{ item.total | round(2) }}</td>
                  </tr>
                {% endfor %}
              </tbody>
            </table>

            <div class="total-section">
              <div>Subtotal: ${{ subtotal | round(2) }}</div>
              <div>Tax ({{ taxRate }}%): ${{ tax | round(2) }}</div>
              <div class="total-amount">Total: ${{ totalAmount | round(2) }}</div>
            </div>

            {% if notes %}
              <div class="notes">
                <h3>Notes</h3>
                <p>{{ notes }}</p>
              </div>
            {% endif %}

            <div class="footer">
              <p>Thank you for your business!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const data = {
      invoiceNumber: 'INV-2024-001',
      date: new Date().toLocaleDateString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      customerName: 'Acme Corporation',
      customerEmail: 'contact@acme.com',
      customerPhone: '+1 (555) 123-4567',
      items: [
        {
          name: 'Web Development Services',
          quantity: 160,
          price: 75,
          total: 12000,
        },
        {
          name: 'UI/UX Design',
          quantity: 40,
          price: 100,
          total: 4000,
        },
        {
          name: 'Project Management',
          quantity: 20,
          price: 85,
          total: 1700,
        },
      ],
      subtotal: 17700,
      taxRate: 10,
      tax: 1770,
      totalAmount: 19470,
      notes: 'Payment is due within 30 days. Please include the invoice number with your payment.',
    };

    const pdfBytes = await this.pdfService.generatePdfFromNunjucksString(
      template,
      data,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="invoice.pdf"',
    });
    res.send(pdfBytes);
  }

  /**
   * Generate a PDF from a Nunjucks template file
   */
  @Get('nunjucks-file-example')
  async generatePdfFromNunjucksFile(@Res() res: Response) {
    const data = {
      invoiceNumber: 'INV-2024-002',
      date: new Date().toLocaleDateString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      customerName: 'Tech Innovations Inc.',
      customerEmail: 'billing@techinnovations.com',
      customerPhone: '+1 (555) 987-6543',
      items: [
        {
          name: 'Cloud Infrastructure Setup',
          quantity: 1,
          price: 5000,
          total: 5000,
        },
        {
          name: 'Maintenance & Support (Monthly)',
          quantity: 3,
          price: 1500,
          total: 4500,
        },
      ],
      subtotal: 9500,
      taxRate: 10,
      tax: 950,
      totalAmount: 10450,
      notes: 'Services rendered for Q1 2024. Invoice must be paid by the due date to maintain service continuity.',
    };

    const pdfBytes = await this.pdfService.generatePdfFromNunjucksFile(
      './examples/sample-template.njk',
      data,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="invoice.pdf"',
    });
    res.send(pdfBytes);
  }
}

