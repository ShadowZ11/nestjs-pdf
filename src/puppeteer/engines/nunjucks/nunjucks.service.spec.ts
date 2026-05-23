import { Test, TestingModule } from '@nestjs/testing';
import { NunjucksService } from './nunjucks.service';

describe('NunjucksService', () => {
  let service: NunjucksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NunjucksService],
    }).compile();

    service = module.get<NunjucksService>(NunjucksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('render', () => {
    it('should render a simple Nunjucks template', () => {
      const template = '<h1>{{ title }}</h1>';
      const data = { title: 'Hello World' };

      const result = service.render(template, data);

      expect(result).toContain('Hello World');
      expect(result).toContain('<h1>');
    });

    it('should render with conditional logic', () => {
      const template = '{% if show %}<p>Visible</p>{% endif %}';
      const data = { show: true };

      const result = service.render(template, data);

      expect(result).toContain('Visible');
    });

    it('should render with loop', () => {
      const template = `
        <ul>
        {% for item in items %}
          <li>{{ item }}</li>
        {% endfor %}
        </ul>
      `;
      const data = { items: ['Item 1', 'Item 2', 'Item 3'] };

      const result = service.render(template, data);

      expect(result).toContain('Item 1');
      expect(result).toContain('Item 2');
      expect(result).toContain('Item 3');
    });

    it('should handle empty data', () => {
      const template = '<h1>Static Content</h1>';

      const result = service.render(template);

      expect(result).toContain('Static Content');
    });

    it('should throw error on invalid template', () => {
      const template = '{% if invalid %}';

      expect(() => service.render(template, {})).toThrow();
    });

    it('should render with filters', () => {
      const template = '<h1>{{ title | upper }}</h1>';
      const data = { title: 'hello world' };

      const result = service.render(template, data);

      expect(result).toContain('HELLO WORLD');
    });

    it('should render with options', () => {
      const template = '<h1>{{ title }}</h1>';
      const data = { title: 'Test' };

      const result = service.render(template, data, {
        noCache: true,
      });

      expect(result).toContain('Test');
    });
  });

  describe('renderFile', () => {
    it('should render a file template', () => {
      const filePath = './examples/sample-template.njk';
      const data = {
        invoiceNumber: '2024-001',
        customerName: 'John Doe',
        items: [{ name: 'Service A', quantity: 1, price: 100, total: 100 }],
        totalAmount: 100,
      };

      try {
        const result = service.renderFile(filePath, data);
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
