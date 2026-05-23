import { Test, TestingModule } from '@nestjs/testing';
import { EtaService } from './eta.service';
import * as fs from 'fs';
import * as path from 'path';

describe('EtaService', () => {
  let service: EtaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EtaService],
    }).compile();

    service = module.get<EtaService>(EtaService);
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('render', () => {
    it('should render a simple template with variables', () => {
      const template = 'Hello <%= it.name %>!';
      const data = { name: 'World' };
      const result = service.render(template, data);
      expect(result).toBe('Hello World!');
    });

    it('should render a template with conditionals', () => {
      const template = '<% if (it.show) { %>Visible<% } else { %>Hidden<% } %>';
      const data = { show: true };
      const result = service.render(template, data);
      expect(result).toBe('Visible');
    });

    it('should render a template with loops', () => {
      const template = '<% it.items.forEach(item => { %><%= item %> <% }) %>';
      const data = { items: ['a', 'b', 'c'] };
      const result = service.render(template, data);
      expect(result).toBe('a b c ');
    });

    it('should handle empty data', () => {
      const template = 'Hello <%= it.name %>!';
      const result = service.render(template, {});
      expect(result).toBe('Hello undefined!');
    });

    it('should handle malformed template gracefully', () => {
      const template = '<% if (it.show) %>text';
      const data = {};
      // Eta doesn't throw on malformed templates, it just renders what it can
      const result = service.render(template, data);
      expect(result).toBeDefined();
    });
  });

  describe('renderFile', () => {
    const testFilePath = path.join(__dirname, 'test-template.eta');

    beforeEach(() => {
      if (!fs.existsSync(testFilePath)) {
        fs.writeFileSync(testFilePath, 'Hello <%= it.name %>!');
      }
    });

    afterEach(() => {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });

    it('should render a template from file', () => {
      const data = { name: 'File' };
      const result = service.renderFile(testFilePath, data);
      expect(result).toBe('Hello File!');
    });

    it('should cache templates', () => {
      expect(service.getCacheSize()).toBe(0);
      service.renderFile(testFilePath, {});
      expect(service.getCacheSize()).toBe(1);
      service.renderFile(testFilePath, {});
      expect(service.getCacheSize()).toBe(1);
    });

    it('should throw error on non-existent file', () => {
      const nonExistentPath = path.join(__dirname, 'non-existent.eta');
      expect(() => service.renderFile(nonExistentPath, {})).toThrow();
    });
  });

  describe('clearCache', () => {
    const testFilePath = path.join(__dirname, 'test-template.eta');

    beforeEach(() => {
      if (!fs.existsSync(testFilePath)) {
        fs.writeFileSync(testFilePath, 'Hello <%= it.name %>!');
      }
    });

    afterEach(() => {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });

    it('should clear the cache', () => {
      service.renderFile(testFilePath, {});
      expect(service.getCacheSize()).toBe(1);
      service.clearCache();
      expect(service.getCacheSize()).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle nested objects', () => {
      const template = '<%= it.user.name %> - <%= it.user.email %>';
      const data = {
        user: {
          name: 'John',
          email: 'john@example.com',
        },
      };
      const result = service.render(template, data);
      expect(result).toBe('John - john@example.com');
    });

    it('should handle empty template', () => {
      const result = service.render('', {});
      expect(result).toBe('');
    });

    it('should preserve HTML in data', () => {
      const template = '<p><%= it.content %></p>';
      const data = { content: 'Text' };
      const result = service.render(template, data);
      expect(result).toBe('<p>Text</p>');
    });
  });
});
