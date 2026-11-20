// Engines are loaded with `require`; hand them the same module objects as the
// imports below so the spies see the calls.
vi.mock('../libs/loadEngine.utils', async () => {
  const modules: Record<string, unknown> = {
    ejs: (await import('ejs')).default,
    eta: await import('eta'),
    handlebars: (await import('handlebars')).default,
    liquidjs: await import('liquidjs'),
    pug: (await import('pug')).default,
  };
  return { loadEngine: (name: string) => modules[name] };
});

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import ejs from 'ejs';
import Handlebars from 'handlebars';
import { Liquid } from 'liquidjs';
import pug from 'pug';

import { EjsService } from './ejs/ejs.service';
import { EtaService } from './eta/eta.service';
import { HandlebarsService } from './handlebars/handlebars.service';
import { LiquidService } from './liquid/liquid.service';
import { PugService } from './pug/pug.service';

// Each engine, with the real library: a template is compiled once and reused,
// including when every call passes a fresh but equal options object.
describe('compiled template cache', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Handlebars: compiles once per template and options', () => {
    const compiles: Array<string> = [];
    // Neither `create` nor an environment's `compile` relies on `this`.
    const { create } = Handlebars;
    vi.spyOn(Handlebars, 'create').mockImplementation(() => {
      const env = create();
      const { compile } = env;
      env.compile = (template, options) => {
        compiles.push(String(template));
        return compile(template, options);
      };
      return env;
    });
    const service = new HandlebarsService();

    expect(
      service.render('Hi {{who}}', { who: 'a' }, { compileOptions: {} }),
    ).toBe('Hi a');
    expect(
      service.render('Hi {{who}}', { who: 'b' }, { compileOptions: {} }),
    ).toBe('Hi b');
    service.render('Bye {{who}}', { who: 'c' }, { compileOptions: {} });

    expect(compiles).toEqual(['Hi {{who}}', 'Bye {{who}}']);
  });

  it('Handlebars: keeps helpers working and reuses the environment for the same options object', () => {
    const create = vi.spyOn(Handlebars, 'create');
    const service = new HandlebarsService();
    const options = {
      helpers: [{ name: 'shout', fn: (s: string) => s.toUpperCase() }],
    };

    expect(service.render('{{shout who}}', { who: 'a' }, options)).toBe('A');
    expect(service.render('{{shout who}}', { who: 'b' }, options)).toBe('B');

    expect(create).toHaveBeenCalledTimes(1);
  });

  it('Pug: compiles once per template and options', () => {
    const compile = vi.spyOn(pug, 'compile');
    const service = new PugService();

    expect(service.render('p= who', { who: 'a' }, { pretty: false })).toBe(
      '<p>a</p>',
    );
    expect(service.render('p= who', { who: 'b' }, { pretty: false })).toBe(
      '<p>b</p>',
    );
    service.render('p= who', { who: 'c' }, { pretty: true });

    expect(compile).toHaveBeenCalledTimes(2);
  });

  it('Liquid: parses once per template and options', () => {
    const parse = vi.spyOn(Liquid.prototype, 'parse');
    const service = new LiquidService();

    expect(
      service.render('Hi {{ who }}', { who: 'a' }, { strictFilters: true }),
    ).toBe('Hi a');
    expect(
      service.render('Hi {{ who }}', { who: 'b' }, { strictFilters: true }),
    ).toBe('Hi b');
    service.render('Hi {{ who }}', { who: 'c' });

    expect(parse).toHaveBeenCalledTimes(2);
  });

  it('Eta: compiles once per template and options', () => {
    const processed: Array<string> = [];
    const plugin = {
      processTemplate: (template: string) => {
        processed.push(template);
        return template;
      },
    };
    const service = new EtaService();
    // Holds a function: compared by reference, so the same object is reused.
    const options = { plugins: [plugin] };

    expect(service.render('Hi <%= it.who %>', { who: 'a' }, options)).toBe(
      'Hi a',
    );
    expect(service.render('Hi <%= it.who %>', { who: 'b' }, options)).toBe(
      'Hi b',
    );

    expect(processed).toEqual(['Hi <%= it.who %>']);
  });

  it('Eta: still escapes output with the default options', () => {
    expect(new EtaService().render('<%= it.html %>', { html: '<b>' })).toBe(
      '&lt;b&gt;',
    );
  });

  describe('EJS', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = mkdtempSync('ejs-cache-');
    });

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true });
    });

    it('compiles a string template once per options', async () => {
      const compile = vi.spyOn(ejs, 'compile');
      const service = new EjsService();

      await expect(
        service.render('Hi <%= who %>', { who: 'a' }, { rmWhitespace: true }),
      ).resolves.toBe('Hi a');
      await expect(
        service.render('Hi <%= who %>', { who: 'b' }, { rmWhitespace: true }),
      ).resolves.toBe('Hi b');

      expect(compile).toHaveBeenCalledTimes(1);
    });

    it('compiles a file once, picks up edits, and resolves includes from it', async () => {
      const compile = vi.spyOn(ejs, 'compile');
      const service = new EjsService();
      const file = join(tempDir, 'page.ejs');
      writeFileSync(join(tempDir, 'header.ejs'), '<h1><%= who %></h1>');
      writeFileSync(file, "<%- await include('header') %>v1");

      await expect(
        service.renderFile(
          'page.ejs',
          { who: 'a' },
          { templateDirectory: tempDir },
        ),
      ).resolves.toBe('<h1>a</h1>v1');
      await expect(
        service.renderFile(
          'page.ejs',
          { who: 'b' },
          { templateDirectory: tempDir },
        ),
      ).resolves.toBe('<h1>b</h1>v1');
      const compilesBeforeEdit = compile.mock.calls.length;

      writeFileSync(file, "<%- await include('header') %>v2");
      await expect(
        service.renderFile(
          'page.ejs',
          { who: 'c' },
          { templateDirectory: tempDir },
        ),
      ).resolves.toBe('<h1>c</h1>v2');

      // The first two renders share one compilation of page.ejs.
      expect(
        compile.mock.calls.filter(([template]) => template.includes('v1')),
      ).toHaveLength(1);
      expect(compile.mock.calls.length).toBeGreaterThan(compilesBeforeEdit);
    });
  });
});
