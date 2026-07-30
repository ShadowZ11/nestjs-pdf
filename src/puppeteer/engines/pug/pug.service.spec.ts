jest.mock('pug', () => ({
  compile: jest.fn(),
}));

jest.mock('node:fs', () => ({
  readFileSync: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { compile } from 'pug';
import { readFileSync } from 'node:fs';
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
      const compiledFn = jest.fn().mockReturnValue('<h1>Hello World</h1>');
      (compile as jest.Mock).mockReturnValue(compiledFn);
      const template = 'h1= title';
      const data = { title: 'Hello World' };

      const result = service.render(template, data);

      expect(compile).toHaveBeenCalledWith(template, {});
      expect(compiledFn).toHaveBeenCalledWith(data);
      expect(result).toBe('<h1>Hello World</h1>');
    });

    it('should render with conditionals', () => {
      const compiledFn = jest.fn().mockReturnValue('<p>Visible</p>');
      (compile as jest.Mock).mockReturnValue(compiledFn);
      const template = `if show
  p Visible`;
      const data = { show: true };

      const result = service.render(template, data);

      expect(compiledFn).toHaveBeenCalledWith(data);
      expect(result).toBe('<p>Visible</p>');
    });

    it('should render with loops', () => {
      const compiledFn = jest.fn().mockReturnValue('<ul><li>Item 1</li></ul>');
      (compile as jest.Mock).mockReturnValue(compiledFn);
      const template = `ul
  each item in items
    li= item`;
      const data = { items: ['Item 1', 'Item 2', 'Item 3'] };

      const result = service.render(template, data);

      expect(compiledFn).toHaveBeenCalledWith(data);
      expect(result).toBe('<ul><li>Item 1</li></ul>');
    });

    it('should handle empty data', () => {
      const compiledFn = jest.fn().mockReturnValue('<h1>Static Content</h1>');
      (compile as jest.Mock).mockReturnValue(compiledFn);
      const template = 'h1 Static Content';

      const result = service.render(template);

      expect(compiledFn).toHaveBeenCalledWith({});
      expect(result).toBe('<h1>Static Content</h1>');
    });

    it('should render with options', () => {
      const compiledFn = jest.fn().mockReturnValue('<h1>Test</h1>');
      (compile as jest.Mock).mockReturnValue(compiledFn);
      const template = 'h1= title';
      const data = { title: 'Test' };

      const result = service.render(template, data, {
        pretty: false,
      });

      expect(compile).toHaveBeenCalledWith(template, { pretty: false });
      expect(result).toBe('<h1>Test</h1>');
    });

    it('should throw a wrapped error when rendering fails', () => {
      (compile as jest.Mock).mockImplementation(() => {
        throw new Error('compile boom');
      });

      expect(() => service.render('h1= title', { title: 'X' })).toThrow(
        'Pug rendering failed: Error: compile boom',
      );
    });
  });

  describe('renderFile', () => {
    it('should render a file template', () => {
      const renderSpy = jest
        .spyOn(service, 'render')
        .mockReturnValue('<h1>File</h1>');
      const filePath = './examples/sample-template.pug';
      const data = {
        invoiceNumber: '2024-001',
        customer: 'John Doe',
        items: [{ name: 'Service A', quantity: 1, price: 100, total: 100 }],
        totalAmount: 100,
      };

      (readFileSync as jest.Mock).mockReturnValue('h1= title');

      const result = service.renderFile(filePath, data, { pretty: true });

      expect(readFileSync).toHaveBeenCalledWith(filePath, 'utf-8');
      expect(renderSpy).toHaveBeenCalledWith('h1= title', data, {
        pretty: true,
      });
      expect(result).toBe('<h1>File</h1>');
    });

    it('should throw a wrapped error when file reading fails', () => {
      (readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('missing file');
      });

      expect(() => service.renderFile('./missing.pug')).toThrow(
        'Pug file rendering failed: Error: missing file',
      );
    });
  });
});
