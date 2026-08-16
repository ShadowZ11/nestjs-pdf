import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Test, type TestingModule } from '@nestjs/testing';

import { MustacheService } from './mustache.service';

describe('MustacheService', () => {
  let service: MustacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MustacheService],
    }).compile();

    service = module.get<MustacheService>(MustacheService);
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('render', () => {
    it('should render a simple template with variables', () => {
      const template = 'Hello {{name}}!';
      const data = { name: 'World' };
      const result = service.render(template, data);
      expect(result).toBe('Hello World!');
    });

    it('should render a template with conditionals', () => {
      const template = '{{#show}}Visible{{/show}}{{^show}}Hidden{{/show}}';
      const data = { show: true };
      const result = service.render(template, data);
      expect(result).toBe('Visible');
    });

    it('should render a template with arrays', () => {
      const template = '{{#items}}{{.}} {{/items}}';
      const data = { items: ['a', 'b', 'c'] };
      const result = service.render(template, data);
      expect(result).toBe('a b c ');
    });

    it('should render with default tags', () => {
      const template = '{{variable}}';
      const data = { variable: 'test' };
      const result = service.render(template, data);
      expect(result).toBe('test');
    });

    it('should handle empty data', () => {
      const template = 'Hello {{name}}!';
      const result = service.render(template, {});
      expect(result).toBe('Hello !');
    });

    it('should throw error on malformed template', () => {
      const template = '{{#unclosed}}text';
      const data = {};
      expect(() => service.render(template, data)).toThrow(
        'Mustache rendering failed',
      );
    });
  });

  describe('renderFile', () => {
    let tempDir: string;
    let testFilePath: string;

    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), 'mustache-service-'));
      testFilePath = join(tempDir, 'test-template.mustache');
      writeFileSync(testFilePath, 'Hello {{name}}!');
    });

    afterEach(() => {
      if (tempDir && existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
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
      const nonExistentPath = join(__dirname, 'non-existent.mustache');
      expect(() => service.renderFile(nonExistentPath, {})).toThrow();
    });
  });

  describe('clearCache', () => {
    let tempDir: string;
    let testFilePath: string;

    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), 'mustache-service-'));
      testFilePath = join(tempDir, 'test-template.mustache');
      writeFileSync(testFilePath, 'Hello {{name}}!');
    });

    afterEach(() => {
      if (tempDir && existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
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
      const template = '{{user.name}} - {{user.email}}';
      const data = {
        user: {
          name: 'John',
          email: 'john@example.com',
        },
      };
      const result = service.render(template, data);
      expect(result).toContain('John');
      expect(result).toContain('john@example.com');
    });

    it('should handle empty template', () => {
      const result = service.render('', {});
      expect(result).toBe('');
    });

    it('should preserve HTML in data', () => {
      const template = '<p>{{content}}</p>';
      const data = { content: 'Text' };
      const result = service.render(template, data);
      expect(result).toBe('<p>Text</p>');
    });
  });
});
