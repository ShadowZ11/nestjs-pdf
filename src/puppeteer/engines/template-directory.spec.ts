import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { TemplateConfigurationException } from '../../exceptions';
import { EjsService } from './ejs/ejs.service';
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
