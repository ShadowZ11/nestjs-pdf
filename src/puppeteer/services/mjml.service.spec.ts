import { Test, TestingModule } from '@nestjs/testing';
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

    const result = await service.render(mjmlTemplate);
    expect(result).toBeDefined();
    expect(result).toContain('<!doctype html');
    expect(result).toContain('Hello World');
  });
});
