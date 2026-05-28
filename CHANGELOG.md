# Changelog

## [2.2.0](https://github.com/ShadowZ11/nestjs-pdf/compare/v2.1.0...v2.2.0) (2026-05-28)


### Features

* adding eta template engine ([ec93bd8](https://github.com/ShadowZ11/nestjs-pdf/commit/ec93bd8bd10175bcf23be39c28fe70afdb57dbbb))
* adding mustache template engine ([27df8d0](https://github.com/ShadowZ11/nestjs-pdf/commit/27df8d0284111d81b042a52f9e03b5a016c1a37b))
* update puppeteer and @puppeteer/browsers imports ([561d0ca](https://github.com/ShadowZ11/nestjs-pdf/commit/561d0cafb15422f82264db0cb2b3a6697af5c09e))


### Bug Fixes

* update nunjucks imports ([b659707](https://github.com/ShadowZ11/nestjs-pdf/commit/b659707a83881ba77688e1fe7e864a648e874b5b))
* update pug imports ([b51421f](https://github.com/ShadowZ11/nestjs-pdf/commit/b51421ff0b2a2a3bbb2e05d40f750f9f7270d8b4))

## [2.1.0](https://github.com/ShadowZ11/nestjs-pdf/compare/v2.0.1...v2.1.0) (2026-05-20)


### Features

* implementation of nunjucks template engine ([a93d244](https://github.com/ShadowZ11/nestjs-pdf/commit/a93d24446d2fe5de9b23855d660556ead1a1d739))
* passing template engine to optional dependencies ([03f13c9](https://github.com/ShadowZ11/nestjs-pdf/commit/03f13c90cf97c90fcc59e6ef3e14c6a5c1ad7bcf))

### Refactor

* remove deprecated method **'generatePdfFromTemplateString'** and **'generatePdfFromTemplateFile'** ([efb222a](https://github.com/ShadowZ11/nestjs-pdf/commit/efb222a8fe12f131e60242bcd62354ca84d943fc))

Update dependencies and other optimizations

## [2.0.1](https://github.com/ShadowZ11/nestjs-pdf/compare/v2.0.0...v2.0.1) (2026-05-18)


### Miscellaneous Chores

* release 2.0.1 ([b6792ef](https://github.com/ShadowZ11/nestjs-pdf/commit/b6792ef5694b8180dd4e307eb2231c599057930e))

## [2.0.0](https://github.com/ShadowZ11/nestjs-pdf/compare/v1.1.1...v2.0.0) (2026-05-15)


### ⚠ BREAKING CHANGES

* renaming of the specific method:
    - `generatePdfFromTemplateString()` -> `generatePdfFromTemplateHbsString()`
    - `generatePdfFromTemplateFile()` -> `generatePdfFromTemplateHbsFile()`
* add EJS template support for PDF generation
* add PUG template support for PDF generation

### Features

* add EJS template support for PDF generation ([21bc771](https://github.com/ShadowZ11/nestjs-pdf/commit/21bc771655954f9ebd721d8044ec49e972e37ddd))
* add PUG template support for PDF generation ([b936e48](https://github.com/ShadowZ11/nestjs-pdf/commit/b936e4886b8a0997995de17689bd68125eea75f1))
* implement mjml support ([98d68f0](https://github.com/ShadowZ11/nestjs-pdf/commit/98d68f0fbf7ddedea09bfba57f33690ff99fbf9c))
* renaming original service method to hbs ([3bcc678](https://github.com/ShadowZ11/nestjs-pdf/commit/3bcc6786d75f8f9a63b6ea47340fa93ad216d372))

## [1.1.1](https://github.com/ShadowZ11/nestjs-pdf/compare/v1.1.0...v1.1.1) (2026-05-12)


### Bug Fixes

* signature function fix ([f75b51d](https://github.com/ShadowZ11/nestjs-pdf/commit/f75b51d465dd620fe7380c964079117de0adfcf5))

## [1.1.0](https://github.com/ShadowZ11/nestjs-pdf/compare/nestjs-pdf-v1.0.2...nestjs-pdf-v1.1.0) (2026-05-10)


### Features

* adding new function getRelativePathToValue ([0568bcc](https://github.com/ShadowZ11/nestjs-pdf/commit/0568bcc4363465777419dacb33348d130812e84f))


### Bug Fixes

* disable false warning and puppeteer test ([97fe0e7](https://github.com/ShadowZ11/nestjs-pdf/commit/97fe0e755da8d7574e627328f4bf9e6e871cc127))
* fix error with signature dommatrix ([8b1798c](https://github.com/ShadowZ11/nestjs-pdf/commit/8b1798c593ac3bd82f9a5d009481fa9564f32252))
* update jest version ([0d55096](https://github.com/ShadowZ11/nestjs-pdf/commit/0d55096cbbad9f3c9dffb61bf3d5970621933ac9))

## [1.0.2](https://github.com/ShadowZ11/nestjs-pdf/compare/v1.0.1...v1.0.2) (2026-05-09)


### Bug Fixes

* disable false warning and puppeteer test ([97fe0e7](https://github.com/ShadowZ11/nestjs-pdf/commit/97fe0e755da8d7574e627328f4bf9e6e871cc127))
* update jest version ([0d55096](https://github.com/ShadowZ11/nestjs-pdf/commit/0d55096cbbad9f3c9dffb61bf3d5970621933ac9))

## [1.0.1](https://github.com/ShadowZ11/nestjs-pdf/compare/v1.0.0...v1.0.1) (2026-05-09)


### Bug Fixes

* fix error with signature dommatrix ([8b1798c](https://github.com/ShadowZ11/nestjs-pdf/commit/8b1798c593ac3bd82f9a5d009481fa9564f32252))

## [1.0.1](https://github.com/ShadowZ11/nestjs-pdf/compare/nestjs-pdf-v1.0.0...nestjs-pdf-v1.0.1) (2026-05-09)


### Bug Fixes

* fix error with signature dommatrix ([8b1798c](https://github.com/ShadowZ11/nestjs-pdf/commit/8b1798c593ac3bd82f9a5d009481fa9564f32252))

## Changelog

All notable changes to this project are documented in this file.

This file is managed by Release Please.
