import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { Test, type TestingModule } from '@nestjs/testing';
import nunjucks from 'nunjucks';

import { TemplateRenderException } from '../../../exceptions';
import { NunjucksService } from './nunjucks.service';

// `_compile` runs once per actual compilation of a template.
type TemplateInternals = { _compile(): void };

describe('NunjucksService', () => {
  let service: NunjucksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NunjucksService],
    }).compile();

    service = module.get<NunjucksService>(NunjucksService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should never configure the global nunjucks environment', () => {
    const configure = vi.spyOn(nunjucks, 'configure');

    service.render('{{ a }}', { a: 1 });
    service.render('{{ a }}', { a: 1 }, { trimBlocks: false });

    expect(configure).not.toHaveBeenCalled();
  });

  describe('render', () => {
    it('should render a simple Nunjucks template', () => {
      expect(
        service.render('<h1>{{ title }}</h1>', { title: 'Hello World' }),
      ).toBe('<h1>Hello World</h1>');
    });

    it('should render with conditional logic', () => {
      expect(
        service.render('{% if show %}<p>Visible</p>{% endif %}', {
          show: true,
        }),
      ).toBe('<p>Visible</p>');
    });

    it('should render with loop', () => {
      expect(
        service.render(
          '{% for item in items %}<li>{{ item }}</li>{% endfor %}',
          {
            items: ['Item 1', 'Item 2'],
          },
        ),
      ).toBe('<li>Item 1</li><li>Item 2</li>');
    });

    it('should handle empty data', () => {
      expect(service.render('<h1>Static {{ missing }}</h1>')).toBe(
        '<h1>Static </h1>',
      );
    });

    it('should render with filters', () => {
      expect(
        service.render('<h1>{{ title | upper }}</h1>', {
          title: 'hello world',
        }),
      ).toBe('<h1>HELLO WORLD</h1>');
    });

    it('should escape output by default, and honor autoescape: false', () => {
      const data = { html: '<b>' };

      expect(service.render('{{ html }}', data)).toBe('&lt;b&gt;');
      expect(service.render('{{ html }}', data, { autoescape: false })).toBe(
        '<b>',
      );
    });

    it('should trim blocks by default, and honor explicit falsy options', () => {
      const template = '{% if a %}\nX{% endif %}';

      expect(service.render(template, { a: true })).toBe('X');
      expect(service.render(template, { a: true }, { trimBlocks: false })).toBe(
        '\nX',
      );
    });

    it('should honor throwOnUndefined', () => {
      expect(service.render('{{ missing }}')).toBe('');
      expect(() =>
        service.render('{{ missing }}', {}, { throwOnUndefined: true }),
      ).toThrow(TemplateRenderException);
    });

    it('should wrap errors of an invalid template', () => {
      expect(() => service.render('{% if invalid %}', {})).toThrow(
        /^Nunjucks rendering failed: /,
      );
      expect(() => service.render('{% if invalid %}', {})).toThrow(
        TemplateRenderException,
      );
    });

    it('should compile a template once, even with fresh equal options', () => {
      const compile = vi.spyOn(
        nunjucks.Template.prototype as unknown as TemplateInternals,
        '_compile',
      );

      service.render('<p>{{ n }}</p>', { n: 1 }, { trimBlocks: true });
      service.render('<p>{{ n }}</p>', { n: 2 }, { trimBlocks: true });
      const result = service.render(
        '<p>{{ n }}</p>',
        { n: 3 },
        { trimBlocks: true },
      );

      expect(result).toBe('<p>3</p>');
      expect(compile).toHaveBeenCalledTimes(1);
    });

    it('should compile separately for different options', () => {
      const compile = vi.spyOn(
        nunjucks.Template.prototype as unknown as TemplateInternals,
        '_compile',
      );

      service.render('{{ n }}', { n: 1 });
      service.render('{{ n }}', { n: 1 }, { autoescape: false });

      expect(compile).toHaveBeenCalledTimes(2);
    });
  });

  describe('renderFile', () => {
    let tempDir: string;

    beforeEach(() => {
      // Under the project cwd: files are resolved against it.
      tempDir = mkdtempSync('nunjucks-service-');
    });

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true });
    });

    it('should render a file resolved from process.cwd()', () => {
      writeFileSync(join(tempDir, 'page.njk'), '<h1>{{ title }}</h1>');

      expect(
        service.renderFile(join(tempDir, 'page.njk'), { title: 'File' }),
      ).toBe('<h1>File</h1>');
    });

    it('should resolve includes through the same loader', () => {
      writeFileSync(join(tempDir, 'header.njk'), '<h1>{{ title }}</h1>');
      writeFileSync(
        join(tempDir, 'page.njk'),
        `{% include "${tempDir}/header.njk" %}<p>body</p>`,
      );

      expect(
        service.renderFile(join(tempDir, 'page.njk'), { title: 'Inc' }),
      ).toBe('<h1>Inc</h1><p>body</p>');
    });

    it('should honor explicit falsy config option values', () => {
      writeFileSync(join(tempDir, 'page.njk'), '{% if a %}\nX{% endif %}');

      expect(
        service.renderFile(
          join(tempDir, 'page.njk'),
          { a: true },
          { trimBlocks: false },
        ),
      ).toBe('\nX');
    });

    it('should re-read an edited file by default (noCache: true)', () => {
      const file = join(tempDir, 'page.njk');
      writeFileSync(file, 'v1');
      expect(service.renderFile(file)).toBe('v1');

      writeFileSync(file, 'v2');
      expect(service.renderFile(file)).toBe('v2');
    });

    it('should keep the compiled file with noCache: false', () => {
      const file = join(tempDir, 'page.njk');
      writeFileSync(file, 'v1');
      expect(service.renderFile(file, {}, { noCache: false })).toBe('v1');

      writeFileSync(file, 'v2');
      expect(service.renderFile(file, {}, { noCache: false })).toBe('v1');
    });

    it('should throw a wrapped error when the file is missing', () => {
      expect(() => service.renderFile(join(tempDir, 'missing.njk'))).toThrow(
        /^Nunjucks file rendering failed: /,
      );
    });
  });
});
