# Changelog

## [3.0.0](https://github.com/ShadowZ11/nestjs-pdf/compare/v2.5.2...v3.0.0) (2026-09-04)


### ⚠ BREAKING CHANGES

* rework on handlebars adapter to use handlebars homemade
* migrate from Jest to Vitest
* update tsconfig.json to keep cjs and esm bundled
* bump dependencies to nest v12

### test

* migrate from Jest to Vitest ([58591f8](https://github.com/ShadowZ11/nestjs-pdf/commit/58591f8b0a2bffb1bd6de6cfe7b6c673506d26b6))


### ✨ Features

* bump dependencies to nest v12 ([49d12e3](https://github.com/ShadowZ11/nestjs-pdf/commit/49d12e39d96c1f4463feecf6378b4ac63ffe94b6))
* update tsconfig.json to keep cjs and esm bundled ([4e71ab0](https://github.com/ShadowZ11/nestjs-pdf/commit/4e71ab08496fe57b4fc33992df5e85d4cabde94b))


### 🐛 Bug Fixes

* ejs, pug and mjml same error as nunjucks ([2a2a9e6](https://github.com/ShadowZ11/nestjs-pdf/commit/2a2a9e6caae04d86fa80fbde680618a3ba75fe50))


### 🔧 Refactoring

* browser service module destroy shutdown and waiting pdf job to finish ([61e52a3](https://github.com/ShadowZ11/nestjs-pdf/commit/61e52a33314494f91310ec95ba282b7aa1679628))
* rework on handlebars adapter to use handlebars homemade ([51d5209](https://github.com/ShadowZ11/nestjs-pdf/commit/51d52092330009ea5f39d9e6283b64dd29a3b9d0))

## [2.5.2](https://github.com/ShadowZ11/nestjs-pdf/compare/v2.5.1...v2.5.2) (2026-08-31)


### 🐛 Bug Fixes

* nunjucks break at startup ([2cf1245](https://github.com/ShadowZ11/nestjs-pdf/commit/2cf1245ac4ca26d847a5df81df2aac3a44b7ae69))

## [2.5.1](https://github.com/ShadowZ11/nestjs-pdf/compare/v2.5.0...v2.5.1) (2026-08-21)


### 🧹 Maintenance

* **deps:** upgrade dependencies ([9043cce](https://github.com/ShadowZ11/nestjs-pdf/commit/9043ccee21f93072e124c7fb79af6c21f761449c))

## [2.5.0](https://github.com/ShadowZ11/nestjs-pdf/compare/v2.4.3...v2.5.0) (2026-08-03)


### ✨ Features

* replace tsup by tsdown for uploading and generating lib ([6eefc1e](https://github.com/ShadowZ11/nestjs-pdf/commit/6eefc1e47a333bcf28f693a8737710b7607eae05))


### 🐛 Bug Fixes

* target close error process ([57054d9](https://github.com/ShadowZ11/nestjs-pdf/commit/57054d9cd3c99d4b594cdd5ea4ca9a0357930f2a))

## [2.4.3](https://github.com/ShadowZ11/nestjs-pdf/compare/v2.4.2...v2.4.3) (2026-07-28)


### 🐛 Bug Fixes

* make handlebars optional to avoid potential breaks in usage ([43ed0c9](https://github.com/ShadowZ11/nestjs-pdf/commit/43ed0c97d840616ec4c4ce038600d281a137feaa))

## [2.4.2](https://github.com/ShadowZ11/nestjs-pdf/compare/v2.4.1...v2.4.2) (2026-07-25)


### 🧹 Maintenance

* **deps-dev:** bump the npm-dependencies group with 2 updates ([991affb](https://github.com/ShadowZ11/nestjs-pdf/commit/991affbebfca0f4cd4fe9ad4f46279739730556d))
* **deps:** bump actions/setup-node from 6 to 7 ([62c3829](https://github.com/ShadowZ11/nestjs-pdf/commit/62c3829f902536582e5a0c96a9c05b7926417f8b))
* **deps:** bump the npm-dependencies group with 7 updates ([03f8d5c](https://github.com/ShadowZ11/nestjs-pdf/commit/03f8d5ce7323791fb2ee1e7f1225cc7b200b9dd9))

## [2.4.1](https://github.com/ShadowZ11/nestjs-pdf/compare/v2.4.0...v2.4.1) (2026-07-12)


### 🧹 Maintenance

* **deps-dev:** bump the npm-dependencies group across 1 directory with 8 updates ([e9a31ba](https://github.com/ShadowZ11/nestjs-pdf/commit/e9a31ba7e551d54443e77a94cc4e181082b56404))
* Remove @nestjs/platform-express from package JSON ([1e331b6](https://github.com/ShadowZ11/nestjs-pdf/commit/1e331b67673d4a46bd25a789c987d8985d7c1fd8))

## [2.4.0](https://github.com/ShadowZ11/nestjs-pdf/compare/v2.3.2...v2.4.0) (2026-07-04)


### ✨ Features

* optimize signature pdf by destroy worker and loading library ([3d9707b](https://github.com/ShadowZ11/nestjs-pdf/commit/3d9707bc008d4fc1a6951df96b4c9a369e7906ef))


### 🧹 Maintenance

* **ci:** dependabot update ([a1b9dae](https://github.com/ShadowZ11/nestjs-pdf/commit/a1b9daef8f1bce97cb3e7dcbc1d0734c9eef87ce))
* **deps:** bump codecov/codecov-action from 5 to 7 ([d3940ff](https://github.com/ShadowZ11/nestjs-pdf/commit/d3940ff05c0cafa8436d9d4b784e934133b78db8))
* **deps:** update dependencies ([e2e8870](https://github.com/ShadowZ11/nestjs-pdf/commit/e2e8870815203693d9b37ce2ce71e6ba65a79f8c))
* **deps:** upgrade dependencies ([fd449f7](https://github.com/ShadowZ11/nestjs-pdf/commit/fd449f7d28bfe8a8a8ece5084b6f584d46f9951a))
* security upgrade with dependencies ([4e9f495](https://github.com/ShadowZ11/nestjs-pdf/commit/4e9f495838f08b813c6de847d49b6d73ffe42cb5))

## [2.3.2](https://github.com/ShadowZ11/nestjs-pdf/compare/v2.3.1...v2.3.2) (2026-06-28)


### 🧹 Maintenance

* **deps:** bump the npm-dependencies group with 11 updates ([fb3d03d](https://github.com/ShadowZ11/nestjs-pdf/commit/fb3d03d83de7b7f1c2ff5810df5c806fc5dfa86e))

## [2.3.1](https://github.com/ShadowZ11/nestjs-pdf/compare/v2.3.0...v2.3.1) (2026-06-26)


### 🐛 Bug Fixes

* adding condition on browser installation when module initialization with executablePath ([d71e00d](https://github.com/ShadowZ11/nestjs-pdf/commit/d71e00d968265adbdedf4aa6efddfaf87af47eb9))

## [2.3.0](https://github.com/ShadowZ11/nestjs-pdf/compare/v2.2.2...v2.3.0) (2026-06-26)


### ✨ Features

* new `executablePath` parameter ([3ec20b9](https://github.com/ShadowZ11/nestjs-pdf/commit/3ec20b9a289acd954399aacb48246ef8801a01e6))

## [2.2.2](https://github.com/ShadowZ11/nestjs-pdf/compare/v2.2.1...v2.2.2) (2026-06-21)


### 🧹 Maintenance

* **deps-dev:** bump @types/node from 25.9.3 to 26.0.0 ([25386df](https://github.com/ShadowZ11/nestjs-pdf/commit/25386dfebc9e52498c58d0c212c56e2bc339036f))
* **deps-dev:** bump the npm-dependencies group across 1 directory with 8 updates ([2771eec](https://github.com/ShadowZ11/nestjs-pdf/commit/2771eec995f6a2d5d75b601221350222730b3698))
* **deps-dev:** bump ts-loader from 9.6.0 to 9.6.1 in the npm-dependencies group across 1 directory ([f81ecdf](https://github.com/ShadowZ11/nestjs-pdf/commit/f81ecdfe7059b33fc6de32d9fa596107eb036c4b))
* **deps:** bump actions/checkout from 6 to 7 ([8600a7a](https://github.com/ShadowZ11/nestjs-pdf/commit/8600a7a1114d43a3384ddd3794aee3cd52068ce3))
* **deps:** bump pdfjs-dist from 5.7.284 to 6.0.227 ([1c524c3](https://github.com/ShadowZ11/nestjs-pdf/commit/1c524c3cb3cc7c683c6c208eb71803b03c32da2b))

## [2.2.1](https://github.com/ShadowZ11/nestjs-pdf/compare/v2.2.0...v2.2.1) (2026-06-10)


### 🧹 Maintenance

* **deps:** bump @puppeteer/browsers from 2.13.2 to 3.0.4 ([db19bca](https://github.com/ShadowZ11/nestjs-pdf/commit/db19bcaab1e5f2ebae465684fdfddb12a406127e))
* **deps:** bump ejs from 5.0.2 to 6.0.1 ([ec687e1](https://github.com/ShadowZ11/nestjs-pdf/commit/ec687e1091fc66061a6bfcdd08991d89d778861b))
* **deps:** bump puppeteer from 24.43.1 to 25.1.0 ([eb99411](https://github.com/ShadowZ11/nestjs-pdf/commit/eb994113634645bf314d7960a2ac9040cdf1fef6))
* **deps:** bump the npm-dependencies group across 1 directory with 8 updates ([a71ef30](https://github.com/ShadowZ11/nestjs-pdf/commit/a71ef30f3b22c270b38d66a6192429c0b3a23c11))
* update pnpm-workspace.yaml ([02b78d1](https://github.com/ShadowZ11/nestjs-pdf/commit/02b78d19037636ceca2c320c3f318405b7496b88))


### 🔄 CI/CD

* **test:** update jest test and release-please-config.json ([0e978d9](https://github.com/ShadowZ11/nestjs-pdf/commit/0e978d9e23882b3c4f8db9d40b3cc272820b90d5))

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
