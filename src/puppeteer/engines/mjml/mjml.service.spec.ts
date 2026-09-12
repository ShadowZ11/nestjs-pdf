import { type Mock, vi } from 'vitest';

vi.mock('mjml', () => ({
  default: vi.fn(),
}));

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
}));

import { readFileSync } from 'node:fs';

import { Test, type TestingModule } from '@nestjs/testing';
import mjml from 'mjml';

import {
  NestjsPdfErrorCode,
  TemplateRenderException,
} from '../../../exceptions';
import { MjmlService } from './mjml.service';

describe('MjmlService', () => {
  let service: MjmlService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MjmlService],
    }).compile();

    service = module.get<MjmlService>(MjmlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should render a basic MJML template to HTML', async () => {
    const mjmlTemplate = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text>Hello World</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;

    (mjml as Mock).mockResolvedValue({
      html: '<!doctype html><html lang="en">Hello World</html>',
    });
    const result = await service.render(mjmlTemplate);
    expect(result).toBeDefined();
    expect(result).toContain('<!doctype html');
    expect(result).toContain('Hello World');
  });

  it('should pass options to mjml render', async () => {
    (mjml as Mock).mockResolvedValue({
      html: '<html lang="en">ok</html>',
    });

    await service.render('<mjml />', { minify: true });

    expect(mjml).toHaveBeenCalledWith('<mjml />', { minify: true });
  });

  it('should render a file by reading its contents first', async () => {
    (readFileSync as Mock).mockReturnValue('<mjml>file</mjml>');
    (mjml as Mock).mockResolvedValue({
      html: '<html lang="en">file</html>',
    });

    const result = await service.renderFile('e:\\templates\\invoice.mjml', {
      minify: false,
    });

    expect(readFileSync).toHaveBeenCalledWith(
      'e:\\templates\\invoice.mjml',
      'utf-8',
    );
    expect(mjml).toHaveBeenCalledWith('<mjml>file</mjml>', { minify: false });
    expect(result).toBe('<html lang="en">file</html>');
  });

  it('should throw a wrapped error when mjml rendering fails', async () => {
    (mjml as Mock).mockRejectedValue(new Error('invalid mjml'));

    await expect(service.render('<mjml />')).rejects.toBeInstanceOf(
      TemplateRenderException,
    );

    let caught: unknown;
    try {
      await service.render('<mjml />');
    } catch (error) {
      caught = error;
    }
    const renderError = caught as TemplateRenderException;
    expect(renderError.engine).toBe('MJML');
    expect(renderError.code).toBe(NestjsPdfErrorCode.TEMPLATE_RENDER_ERROR);
    expect(renderError.cause).toBeInstanceOf(Error);
  });

  it('should throw a wrapped error when the file cannot be read', async () => {
    (readFileSync as Mock).mockImplementation(() => {
      throw new Error('file not found');
    });

    await expect(
      service.renderFile('e:\\templates\\missing.mjml'),
    ).rejects.toBeInstanceOf(TemplateRenderException);

    let caught: unknown;
    try {
      await service.renderFile('e:\\templates\\missing.mjml');
    } catch (error) {
      caught = error;
    }
    const renderError = caught as TemplateRenderException;
    expect(renderError.engine).toBe('MJML');
    expect(renderError.code).toBe(NestjsPdfErrorCode.TEMPLATE_RENDER_ERROR);
    expect(renderError.cause).toBeInstanceOf(Error);
  });
});
