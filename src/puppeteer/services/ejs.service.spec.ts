import { Test, TestingModule } from '@nestjs/testing';
import { EjsService } from './ejs.service';

describe('EjsService', () => {
  let service: EjsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EjsService],
    }).compile();

    service = module.get<EjsService>(EjsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('render', () => {
    it('should render a simple EJS template', async () => {
      const template = '<h1><%= title %></h1>';
      const data = { title: 'Hello World' };

      const result = await service.render(template, data);

      expect(result).toContain('Hello World');
      expect(result).toContain('<h1>');
    });

    it('should render with conditional logic', async () => {
      const template = '<% if (show) { %><p>Visible</p><% } %>';
      const data = { show: true };

      const result = await service.render(template, data);

      expect(result).toContain('Visible');
    });

    it('should render with loop', async () => {
      const template = `
        <ul>
        <% items.forEach(item => { %>
          <li><%= item %></li>
        <% }); %>
        </ul>
      `;
      const data = { items: ['Item 1', 'Item 2', 'Item 3'] };

      const result = await service.render(template, data);

      expect(result).toContain('Item 1');
      expect(result).toContain('Item 2');
      expect(result).toContain('Item 3');
    });

    it('should handle empty data', async () => {
      const template = '<h1>Static Content</h1>';

      const result = await service.render(template);

      expect(result).toContain('Static Content');
    });

    it('should throw error on invalid template', async () => {
      const template = '<% invalid syntax';

      await expect(service.render(template, {})).rejects.toThrow();
    });

    it('should render with options', async () => {
      const template = '<h1><%= title %></h1>';
      const data = { title: 'Test' };

      const result = await service.render(template, data, {
        cache: false,
      });

      expect(result).toContain('Test');
    });
  });

  describe('renderFile', () => {
    it('should render a file template', async () => {
      const filePath = './examples/sample-template.ejs';
      const data = {
        invoiceNumber: '2024-001',
        customerName: 'John Doe',
        items: [{ name: 'Service A', quantity: 1, price: 100, total: 100 }],
        totalAmount: 100,
      };

      try {
        const result = await service.renderFile(filePath, data);
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
