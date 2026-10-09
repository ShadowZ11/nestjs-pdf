import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Test, type TestingModule } from '@nestjs/testing';

import { TemplateRenderException } from '../../../exceptions';
import { LiquidService } from './liquid.service';

describe('LiquidService', () => {
  let service: LiquidService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LiquidService],
    }).compile();

    service = module.get<LiquidService>(LiquidService);
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('render', () => {
    it('should render a simple template with variables', () => {
      const template = 'Hello {{ name }}!';
      const data = { name: 'World' };
      const result = service.render(template, data);
      expect(result).toBe('Hello World!');
    });

    it('should render a template with conditionals', () => {
      const template = '{% if show %}Visible{% else %}Hidden{% endif %}';
      const data = { show: true };
      const result = service.render(template, data);
      expect(result).toBe('Visible');
    });

    it('should render a template with loops', () => {
      const template = '{% for item in items %}{{ item }} {% endfor %}';
      const data = { items: ['a', 'b', 'c'] };
      const result = service.render(template, data);
      expect(result).toBe('a b c ');
    });

    it('should apply filters', () => {
      const template = '{{ name | upcase }} - {{ price | times: 2 }}';
      const data = { name: 'liquid', price: 10 };
      const result = service.render(template, data);
      expect(result).toBe('LIQUID - 20');
    });

    it('should handle empty data', () => {
      const template = 'Hello {{ name }}!';
      const result = service.render(template, {});
      expect(result).toBe('Hello !');
    });

    it('should throw TemplateRenderException on malformed template', () => {
      const template = '{% if show %}text';
      expect(() => service.render(template, {})).toThrow(
        TemplateRenderException,
      );
      expect(() => service.render(template, {})).toThrow(
        /Liquid rendering failed/,
      );
    });

    it('should build a dedicated Liquid instance when options are provided', () => {
      const template = '<p>{{ content }}</p>';
      const result = service.render(
        template,
        { content: '<b>bold</b>' },
        { outputEscape: 'escape' },
      );
      expect(result).toBe('<p>&lt;b&gt;bold&lt;/b&gt;</p>');
    });

    it('should honor strictVariables option', () => {
      expect(() =>
        service.render('{{ missing }}', {}, { strictVariables: true }),
      ).toThrow(/Liquid rendering failed/);
    });

    it('should reuse the default instance when options are empty', () => {
      const result = service.render('{{ a }}', { a: 1 }, {});
      expect(result).toBe('1');
    });
  });

  describe('renderFile', () => {
    let tempDir: string;
    let testFilePath: string;

    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), 'liquid-service-'));
      testFilePath = join(tempDir, 'test-template.liquid');
      writeFileSync(testFilePath, 'Hello {{ name }}!');
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

    it('should not use the cache when cache option is false', () => {
      expect(service.getCacheSize()).toBe(0);
      service.renderFile(testFilePath, { name: 'File' }, { cache: false });
      expect(service.getCacheSize()).toBe(0);
    });

    it('should resolve partials from the root option', () => {
      writeFileSync(join(tempDir, 'header.liquid'), '<h1>{{ title }}</h1>');
      writeFileSync(testFilePath, "{% render 'header', title: title %}");

      const result = service.renderFile(
        testFilePath,
        { title: 'Invoice' },
        { root: [tempDir], extname: '.liquid' },
      );
      expect(result).toBe('<h1>Invoice</h1>');
    });

    it('should throw TemplateRenderException on non-existent file', () => {
      const nonExistentPath = join(tempDir, 'non-existent.liquid');
      expect(() => service.renderFile(nonExistentPath, {})).toThrow(
        TemplateRenderException,
      );
      expect(() => service.renderFile(nonExistentPath, {})).toThrow(
        /Liquid file rendering failed/,
      );
    });

    it('should stop caching once the cache is full', () => {
      for (let i = 0; i < 101; i++) {
        const filePath = join(tempDir, `template-${i}.liquid`);
        writeFileSync(filePath, `{{ i }}`);
        service.renderFile(filePath, { i });
      }
      expect(service.getCacheSize()).toBe(100);
    });
  });

  describe('clearCache', () => {
    it('should clear the cache', () => {
      const tempDir = mkdtempSync(join(tmpdir(), 'liquid-service-'));
      const testFilePath = join(tempDir, 'test-template.liquid');
      writeFileSync(testFilePath, 'Hello {{ name }}!');

      try {
        service.renderFile(testFilePath, {});
        expect(service.getCacheSize()).toBe(1);
        service.clearCache();
        expect(service.getCacheSize()).toBe(0);
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe('edge cases', () => {
    it('should handle nested objects', () => {
      const template = '{{ user.name }} - {{ user.email }}';
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

    it('should preserve HTML in data by default', () => {
      const template = '<p>{{ content }}</p>';
      const data = { content: '<b>Text</b>' };
      const result = service.render(template, data);
      expect(result).toBe('<p><b>Text</b></p>');
    });
  });
});
