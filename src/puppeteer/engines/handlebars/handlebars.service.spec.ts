import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

import { HandlebarsService } from './handlebars.service';

// Temp dirs are created under the project cwd so that `templateDirectory` /
// `partialDirectory` (resolved against `process.cwd()`) stay valid, even on
// Windows where `os.tmpdir()` may live on another drive.
const makeTempDir = () => mkdtempSync('hbs-service-');

describe('HandlebarsService', () => {
  let service: HandlebarsService;

  beforeEach(() => {
    service = new HandlebarsService();
  });

  describe('render', () => {
    it('should render a template with variables', () => {
      expect(service.render('Hello {{name}}!', { name: 'World' })).toBe(
        'Hello World!',
      );
    });

    it('should default parameters to an empty object', () => {
      expect(service.render('Hello {{name}}!')).toBe('Hello !');
    });

    it('should register per-call helpers', () => {
      const html = service.render(
        '{{shout name}}',
        { name: 'hi' },
        {
          helpers: [{ name: 'shout', fn: (v: string) => v.toUpperCase() }],
        },
      );
      expect(html).toBe('HI');
    });

    it('should forward compileOptions to Handlebars.compile', () => {
      expect(
        service.render(
          '{{html}}',
          { html: '<b>x</b>' },
          {
            compileOptions: { noEscape: true },
          },
        ),
      ).toBe('<b>x</b>');
    });

    it('should not leak helpers between calls with different options', () => {
      service.render(
        '{{shout x}}',
        { x: 'a' },
        {
          helpers: [{ name: 'shout', fn: (v: string) => v.toUpperCase() }],
        },
      );
      expect(() => service.render('{{shout x}}', { x: 'a' })).toThrow(
        /Handlebars rendering failed/,
      );
    });

    it('should throw a wrapped error on an invalid template', () => {
      expect(() => service.render('{{#if open}}no end')).toThrow(
        /Handlebars rendering failed/,
      );
    });

    it('should reuse the compiled environment when the same options object is passed', () => {
      const options = {
        helpers: [{ name: 'shout', fn: (v: string) => v.toUpperCase() }],
      };
      expect(service.render('{{shout x}}', { x: 'a' }, options)).toBe('A');
      expect(service.render('{{shout x}}', { x: 'b' }, options)).toBe('B');
    });
  });

  describe('partials', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = makeTempDir();
    });

    afterEach(() => {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('should register every file in partialDirectory as a partial', () => {
      writeFileSync(join(tempDir, 'header.hbs'), '<h1>{{title}}</h1>');

      expect(
        service.render(
          '{{> header}}',
          { title: 'Doc' },
          {
            partialDirectory: tempDir,
          },
        ),
      ).toBe('<h1>Doc</h1>');
    });

    it('should throw when partialDirectory does not exist', () => {
      expect(() =>
        service.render('{{> x}}', {}, { partialDirectory: 'does/not/exist' }),
      ).toThrow(/partial directory does not exist/);
    });

    it('should skip entries in partialDirectory that are not files', () => {
      writeFileSync(join(tempDir, 'header.hbs'), '<h1>{{title}}</h1>');
      mkdirSync(join(tempDir, 'nested'));

      expect(
        service.render(
          '{{> header}}',
          { title: 'Doc' },
          {
            partialDirectory: tempDir,
          },
        ),
      ).toBe('<h1>Doc</h1>');
    });
  });

  describe('renderFile', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = makeTempDir();
      writeFileSync(join(tempDir, 'invoice.hbs'), 'Invoice {{id}}');
    });

    afterEach(() => {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('should render a template read from templateDirectory', () => {
      expect(
        service.renderFile(
          'invoice.hbs',
          { id: 42 },
          {
            templateDirectory: tempDir,
          },
        ),
      ).toBe('Invoice 42');
    });

    it('should throw when templateDirectory is not set', () => {
      expect(() => service.renderFile('invoice.hbs')).toThrow(
        /`templateDirectory` is not set/,
      );
    });

    it('should throw a wrapped error when the file cannot be read', () => {
      expect(() =>
        service.renderFile('missing.hbs', {}, { templateDirectory: tempDir }),
      ).toThrow(/Handlebars file rendering failed/);
    });

    it('should reject a file path that escapes templateDirectory', () => {
      expect(() =>
        service.renderFile('../secret.hbs', {}, { templateDirectory: tempDir }),
      ).toThrow(/resolves outside `templateDirectory`/);
    });
  });
});
