jest.mock('mjml', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('node:fs', () => ({
  readFileSync: jest.fn(),
}));

import { readFileSync } from 'node:fs';

import { Test, type TestingModule } from '@nestjs/testing';
import mjml from 'mjml';

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

    (mjml as jest.Mock).mockResolvedValue({
      html: '<!doctype html><html lang="en">Hello World</html>',
    });
    const result = await service.render(mjmlTemplate);
    expect(result).toBeDefined();
    expect(result).toContain('<!doctype html');
    expect(result).toContain('Hello World');
  });

  it('should pass options to mjml render', async () => {
    (mjml as jest.Mock).mockResolvedValue({
      html: '<html lang="en">ok</html>',
    });

    await service.render('<mjml />', { minify: true });

    expect(mjml).toHaveBeenCalledWith('<mjml />', { minify: true });
  });

  it('should render a file by reading its contents first', async () => {
    (readFileSync as jest.Mock).mockReturnValue('<mjml>file</mjml>');
    (mjml as jest.Mock).mockResolvedValue({
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
});
