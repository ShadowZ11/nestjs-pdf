/**
 * Example: Using MJML with nestjs-pdf
 *
 * This example demonstrates how to set up and use MJML templates
 * to generate PDFs in a NestJS application.
 */

import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { NestjsPdfService } from '../src/nestjs-pdf.service';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: NestjsPdfService) {}

  @Get('mjml-example')
  async generateMjmlPdf(@Res() res: Response) {
    try {
      // Simple MJML template
      const mjmlTemplate = `
        <mjml>
          <mj-head>
            <mj-title>Invoice</mj-title>
          </mj-head>
          <mj-body>
            <mj-section>
              <mj-column>
                <mj-text font-size="24px" font-weight="bold" color="#1abc9c">
                  Invoice #001
                </mj-text>
              </mj-column>
            </mj-section>
            <mj-section>
              <mj-column>
                <mj-text>
                  <strong>Invoice Date:</strong> 2024-05-12
                </mj-text>
                <mj-text>
                  <strong>Due Date:</strong> 2024-06-12
                </mj-text>
              </mj-column>
            </mj-section>
            <mj-section>
              <mj-column>
                <mj-table border-color="#1abc9c">
                  <tr style="border-bottom:1px solid #1abc9c;text-align:left;padding:15px 0;">
                    <th style="border:none;border-bottom:1px solid #1abc9c;padding:15px 0;padding-right:20px;">Item</th>
                    <th style="border:none;border-bottom:1px solid #1abc9c;padding:15px 0;padding-right:20px;">Quantity</th>
                    <th style="border:none;border-bottom:1px solid #1abc9c;padding:15px 0;">Price</th>
                  </tr>
                  <tr>
                    <td style="border:none;padding:15px 0;padding-right:20px;">Service A</td>
                    <td style="border:none;padding:15px 0;padding-right:20px;">1</td>
                    <td style="border:none;padding:15px 0;">$500</td>
                  </tr>
                  <tr>
                    <td style="border:none;padding:15px 0;padding-right:20px;">Service B</td>
                    <td style="border:none;padding:15px 0;padding-right:20px;">2</td>
                    <td style="border:none;padding:15px 0;">$300</td>
                  </tr>
                </mj-table>
              </mj-column>
            </mj-section>
            <mj-section>
              <mj-column>
                <mj-text>
                  <strong>Total:</strong> $1,100
                </mj-text>
              </mj-column>
            </mj-section>
            <mj-section>
              <mj-column>
                <mj-button href="https://example.com">
                  Pay Now
                </mj-button>
              </mj-column>
            </mj-section>
          </mj-body>
        </mjml>
      `;

      // Generate PDF from MJML
      const pdfBuffer = await this.pdfService.generatePdfFromMjmlString(
        mjmlTemplate,
        {
          pdfOptions: {
            format: 'A4',
            margin: {
              top: '10mm',
              right: '10mm',
              bottom: '10mm',
              left: '10mm',
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

  @Get('mjml-file-example')
  async generateMjmlPdfFromFile(@Res() res: Response) {
    try {
      // Generate PDF from MJML file
      const pdfBuffer = await this.pdfService.generatePdfFromMjmlFile(
        './templates/invoice.mjml',
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
 * import { PuppeteerMjmlModule } from '@shad0wz7/nestjs-pdf';
 *
 * @Module({
 *   imports: [
 *     NestjsPdfModule.forRoot({
 *       hbsOptions: {
 *         // Handlebars options
 *       },
 *     })
 *   ],
 *   controllers: [PdfController],
 * })
 * export class AppModule {}
 */
