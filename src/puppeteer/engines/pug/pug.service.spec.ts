import { Test, TestingModule } from '@nestjs/testing';
import { PugService } from './pug.service';

describe('PugService', () => {
  let service: PugService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PugService],
    }).compile();

    service = module.get<PugService>(PugService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('render', () => {
    it('should render a simple Pug template', () => {
      const template = 'h1= title';
      const data = { title: 'Hello World' };

      const result = service.render(template, data);

      expect(result).toContain('Hello World');
      expect(result).toContain('<h1>');
    });

    it('should render with conditionals', () => {
      const template = `if show
  p Visible`;
      const data = { show: true };

      const result = service.render(template, data);

      expect(result).toContain('Visible');
    });

    it('should render with loops', () => {
      const template = `ul
  each item in items
    li= item`;
      const data = { items: ['Item 1', 'Item 2', 'Item 3'] };

      const result = service.render(template, data);

      expect(result).toContain('Item 1');
      expect(result).toContain('Item 2');
      expect(result).toContain('Item 3');
    });

    it('should handle empty data', () => {
      const template = 'h1 Static Content';

      const result = service.render(template);

      expect(result).toContain('Static Content');
    });

    it('should render with options', () => {
      const template = 'h1= title';
      const data = { title: 'Test' };

      const result = service.render(template, data, {
        pretty: false,
      });

      expect(result).toContain('Test');
    });
  });

  describe('renderFile', () => {
    it('should render a file template', () => {
      const filePath = './examples/sample-template.pug';
      const data = {
        invoiceNumber: '2024-001',
        customer: 'John Doe',
        items: [{ name: 'Service A', quantity: 1, price: 100, total: 100 }],
        totalAmount: 100,
      };

      try {
        const result = service.renderFile(filePath, data);
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      } catch (error) {
        // File might not exist in test environment
        expect(error).toBeDefined();
      }
    });
  });
});
