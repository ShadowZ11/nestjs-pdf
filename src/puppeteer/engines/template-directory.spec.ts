import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

import { TemplateConfigurationException } from '../../exceptions';
import { type EjsOptions, EjsService } from './ejs/ejs.service';
import { EtaService } from './eta/eta.service';
import { HandlebarsService } from './handlebars/handlebars.service';
import { LiquidService } from './liquid/liquid.service';
import { MjmlService } from './mjml/mjml.service';
import { MustacheService } from './mustache/mustache.service';
import { NunjucksService } from './nunjucks/nunjucks.service';
import { PugService } from './pug/pug.service';

type RenderFile = (
  file: string,
  templateDirectory: string,
) => Promise<string> | string;

const MJML_TEMPLATE =
  '<mjml><mj-body><mj-section><mj-column><mj-text>Hello inside</mj-text></mj-column></mj-section></mj-body></mjml>';

// Every engine, with the real library, through its public renderFile.
const engines: Array<{
  name: string;
  template: string;
  renderFile: RenderFile;
}> = [
  {
    name: 'Handlebars',
    template: 'Hello {{who}}',
    renderFile: (file, templateDirectory) =>
      new HandlebarsService().renderFile(
        file,
        { who: 'inside' },
        { templateDirectory },
      ),
  },
  {
    name: 'EJS',
    template: 'Hello <%= who %>',
    renderFile: (file, templateDirectory) =>
      new EjsService().renderFile(
        file,
        { who: 'inside' },
        { templateDirectory },
      ),
  },
  {
    name: 'Eta',
    template: 'Hello <%= it.who %>',
    renderFile: (file, templateDirectory) =>
      new EtaService().renderFile(
        file,
        { who: 'inside' },
        { templateDirectory },
      ),
  },
  {
    name: 'Liquid',
    template: 'Hello {{ who }}',
    renderFile: (file, templateDirectory) =>
      new LiquidService().renderFile(
        file,
        { who: 'inside' },
        { templateDirectory },
      ),
  },
  {
    name: 'Mustache',
    template: 'Hello {{who}}',
    renderFile: (file, templateDirectory) =>
      new MustacheService().renderFile(
        file,
        { who: 'inside' },
        { templateDirectory },
      ),
  },
  {
    name: 'Nunjucks',
    template: 'Hello {{ who }}',
    renderFile: (file, templateDirectory) =>
      new NunjucksService().renderFile(
        file,
        { who: 'inside' },
        { templateDirectory },
      ),
  },
  {
    name: 'Pug',
    template: 'p Hello #{who}',
    renderFile: (file, templateDirectory) =>
      new PugService().renderFile(
        file,
        { who: 'inside' },
        { templateDirectory },
      ),
  },
  {
    name: 'MJML',
    template: MJML_TEMPLATE,
    renderFile: (file, templateDirectory) =>
      new MjmlService().renderFile(file, { templateDirectory }),
  },
];

describe.each(engines)('$name renderFile with templateDirectory', (engine) => {
  let root: string;
  let templateDirectory: string;

  beforeEach(() => {
    // Under the project cwd: `templateDirectory` is resolved against it.
    root = mkdtempSync('template-directory-');
    templateDirectory = join(root, 'templates');
    mkdirSync(templateDirectory);
    writeFileSync(join(templateDirectory, 'inside.tpl'), engine.template);
    writeFileSync(join(root, 'secret.tpl'), 'TOP SECRET');
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('should render a file inside templateDirectory', async () => {
    await expect(
      Promise.resolve(engine.renderFile('inside.tpl', templateDirectory)),
    ).resolves.toContain('Hello inside');
    // The first MJML render loads the whole library: slow on a cold start.
  }, 30_000);

  it('should accept an absolute templateDirectory', async () => {
    await expect(
      Promise.resolve(
        engine.renderFile('inside.tpl', resolve(templateDirectory)),
      ),
    ).resolves.toContain('Hello inside');
  });

  it.each([
    ['a parent path', '../secret.tpl'],
    ['an absolute path', () => resolve(root, 'secret.tpl')],
  ])('should refuse %s', async (_label, file) => {
    const path = typeof file === 'function' ? file() : file;

    await expect(
      (async () => engine.renderFile(path, templateDirectory))(),
    ).rejects.toThrow(TemplateConfigurationException);
  });
});

type RenderWithOptions = (
  file: string,
  templateDirectory: string,
  options?: Record<string, unknown>,
) => Promise<string> | string;

const MJML_SECTION = (text: string) =>
  `<mj-section><mj-column><mj-text>${text}</mj-text></mj-column></mj-section>`;

// Every engine whose templates can load other files, with the real library.
const nestedEngines: Array<{
  name: string;
  ext: string;
  /** A partial's content, rendering `text`. */
  partial: (text: string) => string;
  /** A template including each of `paths`. */
  including: (...paths: Array<string>) => string;
  renderFile: RenderWithOptions;
  /**
   * Options moving the library's own lookup base (`views`, `root`...) to the
   * parent of `templateDirectory` (`..`, from it), and an include then
   * reaching the secret through it.
   */
  escape?: { options: Record<string, unknown>; path: string };
}> = [
  {
    name: 'Nunjucks',
    ext: '.njk',
    partial: (text) => text,
    including: (...paths) =>
      paths.map((path) => `{% include "${path}" %}`).join(''),
    renderFile: (file, templateDirectory, options) =>
      new NunjucksService().renderFile(
        file,
        {},
        { ...options, templateDirectory },
      ),
  },
  {
    name: 'EJS',
    ext: '.ejs',
    partial: (text) => text,
    including: (...paths) =>
      // The service renders with `async: true`.
      paths.map((path) => `<%- await include('${path}') %>`).join(''),
    renderFile: (file, templateDirectory, options) =>
      new EjsService().renderFile(file, {}, { ...options, templateDirectory }),
    escape: { options: { views: ['..'] }, path: 'secret.ejs' },
  },
  {
    name: 'Eta',
    ext: '.eta',
    partial: (text) => text,
    including: (...paths) =>
      paths.map((path) => `<%~ include('${path}') %>`).join(''),
    renderFile: (file, templateDirectory, options) =>
      new EtaService().renderFile(file, {}, { ...options, templateDirectory }),
    escape: { options: { views: '..' }, path: 'secret.eta' },
  },
  {
    name: 'Liquid',
    ext: '.liquid',
    partial: (text) => text,
    including: (...paths) =>
      paths.map((path) => `{% include '${path}' %}`).join(''),
    renderFile: (file, templateDirectory, options) =>
      new LiquidService().renderFile(
        file,
        {},
        { ...options, templateDirectory },
      ),
    escape: { options: { root: ['..'] }, path: 'secret.liquid' },
  },
  {
    name: 'Pug',
    ext: '.pug',
    partial: (text) => `| ${text}`,
    including: (...paths) => paths.map((path) => `include ${path}`).join('\n'),
    renderFile: (file, templateDirectory, options) =>
      new PugService().renderFile(file, {}, { ...options, templateDirectory }),
    escape: { options: { basedir: '..' }, path: '/secret.pug' },
  },
  {
    name: 'MJML',
    ext: '.mjml',
    partial: MJML_SECTION,
    including: (...paths) =>
      `<mjml><mj-body>${paths
        .map((path) => `<mj-include path="${path}" />`)
        .join('')}</mj-body></mjml>`,
    renderFile: (file, templateDirectory, options) =>
      new MjmlService().renderFile(file, {
        ignoreIncludes: false,
        ...options,
        templateDirectory,
      }),
    escape: { options: { includePath: '..' }, path: '../secret.mjml' },
  },
];

describe.each(nestedEngines)(
  '$name nested loads with templateDirectory',
  (engine) => {
    let root: string;
    let templateDirectory: string;
    const file = (name: string) => `${name}${engine.ext}`;
    // Option paths are given from `templateDirectory`: make them absolute.
    const fromTemplateDirectory = (value: unknown): unknown =>
      Array.isArray(value)
        ? value.map(fromTemplateDirectory)
        : value === '..'
          ? resolve(templateDirectory, value)
          : value;
    const render = async (
      template: string,
      options: Record<string, unknown> = {},
    ) => {
      writeFileSync(join(templateDirectory, file('main')), template);
      return engine.renderFile(
        file('main'),
        templateDirectory,
        Object.fromEntries(
          Object.entries(options).map(([key, value]) => [
            key,
            fromTemplateDirectory(value),
          ]),
        ),
      );
    };
    /** Renders `template`: it either fails or does not output the secret. */
    const expectNoSecret = async (
      template: string,
      options?: Record<string, unknown>,
    ) => {
      const outcome = await render(template, options).then(
        (html) => html,
        (error: unknown) => error,
      );
      expect(String(outcome)).not.toContain('TOP SECRET');
      return outcome;
    };

    beforeEach(() => {
      root = mkdtempSync('template-directory-');
      templateDirectory = join(root, 'templates');
      mkdirSync(join(templateDirectory, 'partials'), { recursive: true });
      writeFileSync(
        join(templateDirectory, 'partials', file('part')),
        engine.partial('PART'),
      );
      writeFileSync(
        join(templateDirectory, 'partials', file('wrap')),
        engine.including(`./${file('part')}`),
      );
      // Shares the `templates` prefix: a bare prefix test accepts it.
      mkdirSync(join(root, 'templates-2'));
      writeFileSync(
        join(root, 'templates-2', file('secret')),
        engine.partial('TOP SECRET'),
      );
      writeFileSync(join(root, file('secret')), engine.partial('TOP SECRET'));
    });

    afterEach(() => {
      rmSync(root, { recursive: true, force: true });
    });

    it('should render includes inside templateDirectory, relative ones included', async () => {
      const html = await render(
        engine.including(
          `partials/${file('part')}`,
          `partials/${file('wrap')}`,
        ),
      );

      expect(html.match(/PART/g)).toHaveLength(2);
    }, 30_000);

    it.each([
      ['a parent include', () => `../${file('secret')}`],
      [
        'a sibling directory sharing the prefix',
        () => `../templates-2/${file('secret')}`,
      ],
      [
        'an absolute include',
        () => resolve(root, file('secret')).replaceAll('\\', '/'),
      ],
    ])('should not read %s', async (_label, path) => {
      await expectNoSecret(engine.including(path()));
    });

    it('should not read through a symbolic link leaving templateDirectory', async (ctx) => {
      try {
        symlinkSync(
          resolve(root, file('secret')),
          join(templateDirectory, file('link')),
        );
      } catch {
        // Symbolic links need extra privileges on Windows.
        ctx.skip();
      }

      await expectNoSecret(engine.including(file('link')));
    });

    it.runIf(engine.escape)(
      'should refuse a lookup option leading outside templateDirectory',
      async () => {
        const { options, path } = engine.escape!;

        const outcome = await expectNoSecret(engine.including(path), options);
        expect(outcome).toBeInstanceOf(TemplateConfigurationException);
      },
    );
  },
);

describe('Nunjucks extends and imports with templateDirectory', () => {
  let root: string;
  let templateDirectory: string;

  beforeEach(() => {
    root = mkdtempSync('template-directory-');
    templateDirectory = join(root, 'templates');
    mkdirSync(templateDirectory);
    writeFileSync(join(root, 'secret.njk'), 'TOP SECRET');
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it.each([
    ['extends', '{% extends "../secret.njk" %}'],
    ['import', '{% import "../secret.njk" as s %}'],
  ])('should refuse a parent %s', (_label, template) => {
    writeFileSync(join(templateDirectory, 'main.njk'), template);

    expect(() =>
      new NunjucksService().renderFile('main.njk', {}, { templateDirectory }),
    ).toThrow(TemplateConfigurationException);
  });
});

describe('EJS includer with templateDirectory', () => {
  let root: string;
  let templateDirectory: string;
  const render = (template: string, includer?: EjsOptions['includer']) => {
    writeFileSync(join(templateDirectory, 'main.ejs'), template);
    return new EjsService().renderFile(
      'main.ejs',
      {},
      { templateDirectory, includer },
    );
  };

  beforeEach(() => {
    root = mkdtempSync('template-directory-');
    templateDirectory = join(root, 'templates');
    mkdirSync(templateDirectory);
    writeFileSync(join(templateDirectory, 'part.ejs'), 'PART');
    writeFileSync(join(root, 'secret.ejs'), 'TOP SECRET');
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('should use a template returned by the caller includer', async () => {
    await expect(
      render("<%- await include('virtual') %>", () => ({
        template: 'VIRTUAL',
      })),
    ).resolves.toBe('VIRTUAL');
  });

  it('should confine a file returned by the caller includer', async () => {
    await expect(
      render("<%- await include('part.ejs') %>", () => ({
        filename: resolve(root, 'secret.ejs'),
      })),
    ).rejects.toThrow(TemplateConfigurationException);
  });

  it('should report an include it cannot find', async () => {
    await expect(render("<%- await include('missing.ejs') %>")).rejects.toThrow(
      'Could not find the include file "missing.ejs"',
    );
  });
});

type CachedRenderFile = (
  file: string,
  templateDirectory: string,
  options?: object,
) => unknown;

// One service for every render: confined engines and their guard are cached.
const cachedEngines: Array<{
  name: string;
  ext: string;
  including: (path: string) => string;
  broken: string;
  /** Include path and options reaching the guard (default: a parent include). */
  escape?: { path: string; options: (root: string) => object };
  renderer: () => CachedRenderFile;
}> = [
  {
    name: 'Nunjucks',
    ext: '.njk',
    including: (path) => `{% include "${path}" %}`,
    broken: '{% if %}',
    renderer: () => {
      const service = new NunjucksService();
      return (file, templateDirectory, options) =>
        service.renderFile(file, {}, { ...options, templateDirectory });
    },
  },
  {
    name: 'EJS',
    ext: '.ejs',
    including: (path) => `<%- await include('${path}') %>`,
    broken: '<% if ( %>',
    renderer: () => {
      const service = new EjsService();
      return (file, templateDirectory, options) =>
        service.renderFile(file, {}, { ...options, templateDirectory });
    },
  },
  {
    name: 'Eta',
    ext: '.eta',
    including: (path) => `<%~ include('${path}') %>`,
    broken: '<% if ( %>',
    // Eta itself refuses `../` outside `views`: widen it to reach the guard.
    escape: { path: 'secret.eta', options: (root) => ({ views: root }) },
    renderer: () => {
      const service = new EtaService();
      return (file, templateDirectory, options) =>
        service.renderFile(
          file,
          {},
          { ...options, templateDirectory, cache: false },
        );
    },
  },
  {
    name: 'Liquid',
    ext: '.liquid',
    including: (path) => `{% include '${path}' %}`,
    broken: '{% if %}',
    // Liquid itself refuses `../` outside `root`: widen it to reach the guard.
    escape: { path: 'secret.liquid', options: (root) => ({ root: [root] }) },
    renderer: () => {
      const service = new LiquidService();
      return (file, templateDirectory, options) =>
        service.renderFile(
          file,
          {},
          { ...options, templateDirectory, cache: false },
        );
    },
  },
  {
    name: 'Pug',
    ext: '.pug',
    including: (path) => `include ${path}`,
    broken: 'div(',
    renderer: () => {
      const service = new PugService();
      return (file, templateDirectory, options) =>
        service.renderFile(file, {}, { ...options, templateDirectory });
    },
  },
];

describe.each(cachedEngines)(
  '$name renders sharing a cached templateDirectory guard',
  (engine) => {
    let root: string;
    let templateDirectory: string;
    let options: object | undefined;
    let renderFile: CachedRenderFile;
    const write = (name: string, content: string) =>
      writeFileSync(join(templateDirectory, `${name}${engine.ext}`), content);
    const outcome = async (name: string) => {
      try {
        return await renderFile(
          `${name}${engine.ext}`,
          templateDirectory,
          options,
        );
      } catch (error) {
        return error;
      }
    };

    beforeEach(() => {
      root = mkdtempSync('template-directory-cache-');
      templateDirectory = join(root, 'templates');
      mkdirSync(templateDirectory);
      writeFileSync(join(root, `secret${engine.ext}`), 'TOP SECRET');
      write(
        'escape',
        engine.including(engine.escape?.path ?? `../secret${engine.ext}`),
      );
      write('broken', engine.broken);
      options = engine.escape?.options(resolve(root));
      renderFile = engine.renderer();
    });

    afterEach(() => {
      rmSync(root, { recursive: true, force: true });
    });

    it('should refuse the same include on every render', async () => {
      expect(await outcome('escape')).toBeInstanceOf(
        TemplateConfigurationException,
      );
      expect(await outcome('escape')).toBeInstanceOf(
        TemplateConfigurationException,
      );
    });

    it('should not report an earlier refusal for another failure', async () => {
      await outcome('escape');

      const error = await outcome('broken');
      expect(error).toBeInstanceOf(Error);
      expect(error).not.toBeInstanceOf(TemplateConfigurationException);
    });
  },
);
