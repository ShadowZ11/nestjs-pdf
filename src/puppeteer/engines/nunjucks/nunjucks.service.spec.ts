jest.mock('nunjucks', () => ({
  configure: jest.fn(),
  render: jest.fn(),
  renderString: jest.fn(),
  default: {
    configure: jest.fn(),
    render: jest.fn(),
    renderString: jest.fn(),
  },
}));

import { Test, type TestingModule } from '@nestjs/testing';
import nunjucks from 'nunjucks';

import { NunjucksService } from './nunjucks.service';

const { configure, render, renderString } = nunjucks;

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
      (renderString as jest.Mock).mockReturnValue('<h1>Hello World</h1>');
      const template = '<h1>{{ title }}</h1>';
      const data = { title: 'Hello World' };

      const result = service.render(template, data);

      expect(renderString).toHaveBeenCalledWith(template, data);
      expect(result).toBe('<h1>Hello World</h1>');
    });

    it('should render with conditional logic', () => {
      (renderString as jest.Mock).mockReturnValue('<p>Visible</p>');
      const template = '{% if show %}<p>Visible</p>{% endif %}';
      const data = { show: true };

      const result = service.render(template, data);

      expect(result).toBe('<p>Visible</p>');
    });

    it('should render with loop', () => {
      (renderString as jest.Mock).mockReturnValue('<li>Item 1</li>');
      const template = `
        <ul>
        {% for item in items %}
          <li>{{ item }}</li>
        {% endfor %}
        </ul>
      `;
      const data = { items: ['Item 1', 'Item 2', 'Item 3'] };

      const result = service.render(template, data);

      expect(result).toBe('<li>Item 1</li>');
    });

    it('should handle empty data', () => {
      (renderString as jest.Mock).mockReturnValue('<h1>Static Content</h1>');
      const template = '<h1>Static Content</h1>';

      const result = service.render(template);

      expect(renderString).toHaveBeenCalledWith(template, {});
      expect(result).toBe('<h1>Static Content</h1>');
    });

    it('should throw error on invalid template', () => {
      (renderString as jest.Mock).mockImplementation(() => {
        throw new Error('bad template');
      });
      const template = '{% if invalid %}';

      expect(() => service.render(template, {})).toThrow(
        'Nunjucks rendering failed: Error: bad template',
      );
    });

    it('should render with filters', () => {
      (renderString as jest.Mock).mockReturnValue('<h1>HELLO WORLD</h1>');
      const template = '<h1>{{ title | upper }}</h1>';
      const data = { title: 'hello world' };

      const result = service.render(template, data);

      expect(result).toBe('<h1>HELLO WORLD</h1>');
    });

    it('should render with options', () => {
      (renderString as jest.Mock).mockReturnValue('<h1>Test</h1>');
      const template = '<h1>{{ title }}</h1>';
      const data = { title: 'Test' };

      const result = service.render(template, data, {
        noCache: true,
      });

      expect(configure).toHaveBeenCalledWith({
        noCache: true,
        watch: false,
        throwOnUndefined: false,
        trimBlocks: true,
        lstripBlocks: true,
      });
      expect(result).toBe('<h1>Test</h1>');
    });
  });

  describe('renderFile', () => {
    it('should render a file template', () => {
      (render as jest.Mock).mockReturnValue('<h1>File</h1>');
      const filePath = './examples/sample-template.njk';
      const data = {
        invoiceNumber: '2024-001',
        customerName: 'John Doe',
        items: [{ name: 'Service A', quantity: 1, price: 100, total: 100 }],
        totalAmount: 100,
      };

      const result = service.renderFile(filePath, data, { watch: true });

      expect(configure).toHaveBeenCalledWith({
        noCache: true,
        watch: true,
        throwOnUndefined: false,
        trimBlocks: true,
        lstripBlocks: true,
      });
      expect(render).toHaveBeenCalledWith(filePath, data);
      expect(result).toBe('<h1>File</h1>');
    });

    it('should throw a wrapped error when rendering fails', () => {
      (render as jest.Mock).mockImplementation(() => {
        throw new Error('render boom');
      });

      expect(() => service.renderFile('./missing.njk')).toThrow(
        'Nunjucks file rendering failed: Error: render boom',
      );
    });
  });
});
