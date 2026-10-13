import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { vi } from 'vitest';

import { EngineNotAvailableException } from '../../exceptions';
import { EjsService } from './ejs/ejs.service';
import { EtaService } from './eta/eta.service';
import { HandlebarsService } from './handlebars/handlebars.service';
import { LiquidService } from './liquid/liquid.service';
import { MjmlService } from './mjml/mjml.service';
import { MustacheService } from './mustache/mustache.service';
import { NunjucksService } from './nunjucks/nunjucks.service';
import { PugService } from './pug/pug.service';

vi.mock('../libs/loadEngine.utils', async () => {
  const { EngineNotAvailableException: Exception } =
    await import('../../exceptions');
  return {
    loadEngine: (packageName: string, engineName: string) => {
      throw new Exception(engineName, packageName);
    },
  };
});

describe('Template engines without their package installed', () => {
  let dir: string;
  let templatePath: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'nestjs-pdf-'));
    templatePath = join(dir, 'template.txt');
    writeFileSync(templatePath, 'Hello');
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('should be instantiable without loading the engine', () => {
    expect(() => [
      new EjsService(),
      new EtaService(),
      new HandlebarsService(),
      new LiquidService(),
      new MjmlService(),
      new MustacheService(),
      new NunjucksService(),
      new PugService(),
    ]).not.toThrow();
  });

  it.each([
    ['EJS', () => new EjsService().render('Hello')],
    ['EJS', () => new EjsService().renderFile(templatePath)],
    ['MJML', () => new MjmlService().render('<mjml />')],
    ['MJML', () => new MjmlService().renderFile(templatePath)],
  ])('should reject with EngineNotAvailableException (%s)', async (_, run) => {
    await expect(run()).rejects.toBeInstanceOf(EngineNotAvailableException);
  });

  it.each([
    ['Eta', () => new EtaService().render('Hello')],
    ['Eta', () => new EtaService().renderFile(templatePath)],
    ['Handlebars', () => new HandlebarsService().render('Hello')],
    [
      'Handlebars',
      () =>
        new HandlebarsService().renderFile(
          'template.txt',
          {},
          {
            templateDirectory: dir,
          },
        ),
    ],
    ['Liquid', () => new LiquidService().render('Hello')],
    ['Liquid', () => new LiquidService().renderFile(templatePath)],
    ['Mustache', () => new MustacheService().render('Hello')],
    ['Mustache', () => new MustacheService().renderFile(templatePath)],
    ['Nunjucks', () => new NunjucksService().render('Hello')],
    ['Nunjucks', () => new NunjucksService().renderFile(templatePath)],
    ['Pug', () => new PugService().render('Hello')],
    ['Pug', () => new PugService().renderFile(templatePath)],
  ])('should throw EngineNotAvailableException (%s)', (engineName, run) => {
    expect(run).toThrow(EngineNotAvailableException);
    expect(run).toThrow(`${engineName} engine is not available`);
  });
});
