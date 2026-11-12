# Security Policy

## Supported Versions

Only the latest major version receives security fixes.

| Version | Supported          |
| ------- | ------------------ |
| 5.x     | :white_check_mark: |
| < 5.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Report them privately through GitHub's [private vulnerability reporting](https://github.com/ShadowZ11/nestjs-pdf/security/advisories/new) (the **Security** tab → **Report a vulnerability**).

Please include as much of the following as you can:

- The affected version(s) of `@shad0wz7/nestjs-pdf`
- The provider involved (Puppeteer, Gotenberg, Api2Pdf) and the template engine, if relevant
- A description of the issue and its impact (e.g. SSRF, template injection, path traversal, local file disclosure)
- Steps to reproduce, ideally a minimal proof of concept
- Any suggested fix or mitigation

## What to Expect

- **Acknowledgement** within 7 days.
- **Initial assessment** (confirmed / not applicable / more info needed) within 14 days.
- Once a fix is ready, a patched release is published and a GitHub Security Advisory is issued. Reporters are credited in the advisory unless they prefer to stay anonymous.

Please give us a reasonable amount of time to release a fix before any public disclosure.

## Scope

In scope: the code published in the `@shad0wz7/nestjs-pdf` npm package.

Out of scope:

- Vulnerabilities in third-party dependencies (Puppeteer, Chromium, template engines, Gotenberg, Api2Pdf…) — please report them upstream. If the library uses a dependency in an unsafe way, that **is** in scope.
- Issues that require rendering untrusted HTML **without** the `security` option enabled. Rendering untrusted content is only supported with the request filter on (see [Restricting what the HTML can load](./README.md#restricting-what-the-html-can-load-ssrf-protection)).
- Untrusted input passed as a template **source** (as opposed to template **data**): template engines execute their templates, so templates must come from a trusted source.
