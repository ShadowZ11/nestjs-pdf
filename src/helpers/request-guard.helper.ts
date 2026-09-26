import { lookup } from 'node:dns/promises';
import { promises } from 'node:fs';
import { BlockList, isIP } from 'node:net';
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from 'node:path';
import { fileURLToPath } from 'node:url';

import { Logger } from '@nestjs/common';
import {
  type BrowserContext,
  type HTTPRequest,
  type Page,
  TargetType,
} from 'puppeteer';

/**
 * Filters what the rendered HTML may load (SSRF protection). Disabled unless set:
 * pass `{}` for the defaults (private networks and `file:` blocked).
 */
export interface PdfSecurityOptions {
  /**
   * Refuse http(s) requests that resolve to a loopback, private, link-local
   * (cloud metadata included) or otherwise non-public address. Default: true
   */
  blockPrivateNetworks?: boolean;
  /**
   * When set, http(s) requests are only allowed to these hosts (`example.com`
   * or `*.example.com`). Listed hosts are trusted, even on a private address.
   */
  allowedHosts?: Array<string>;
  /**
   * `file:` requests are refused unless the file is inside one of these
   * directories (symbolic links are resolved).
   */
  allowedFileRoots?: Array<string>;
  /** Set to false to disable JavaScript in the rendered page. Default: true */
  javascriptEnabled?: boolean;
}

const blockedRanges = new BlockList();
for (const [address, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  blockedRanges.addSubnet(address, prefix, 'ipv4');
}
for (const [address, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['64:ff9b::', 96],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  blockedRanges.addSubnet(address, prefix, 'ipv6');
}

const IPV4_MAPPED_IPV6 = /^::ffff:([\da-f]{1,4}):([\da-f]{1,4})$/i;

/** True for addresses that must not be reachable from a rendered document. */
export function isPrivateAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    return blockedRanges.check(address, 'ipv4');
  }
  if (family === 6) {
    // WHATWG URL serialises ::ffff:127.0.0.1 as ::ffff:7f00:1
    const mapped = IPV4_MAPPED_IPV6.exec(address);
    if (mapped) {
      const high = Number.parseInt(mapped[1], 16);
      const low = Number.parseInt(mapped[2], 16);
      return isPrivateAddress(
        [high >> 8, high & 0xff, low >> 8, low & 0xff].join('.'),
      );
    }
    return blockedRanges.check(address, 'ipv6');
  }
  // Not an IP: unknown format, refuse.
  return true;
}

function hostMatches(hostname: string, pattern: string): boolean {
  const host = hostname.toLowerCase();
  const rule = pattern.toLowerCase();
  if (rule.startsWith('*.')) {
    return host.endsWith(rule.slice(1));
  }
  return host === rule;
}

function isLocalhostName(hostname: string): boolean {
  return hostname === 'localhost' || hostname.endsWith('.localhost');
}

async function resolvesToPrivateAddress(hostname: string): Promise<boolean> {
  // IPv6 literals come bracketed from URL.hostname
  const host = hostname.replace(/^\[|\]$/g, '');
  if (isIP(host)) {
    return isPrivateAddress(host);
  }
  if (isLocalhostName(host)) {
    return true;
  }
  try {
    const addresses = await lookup(host, { all: true, verbatim: true });
    return addresses.some(({ address }) => isPrivateAddress(address));
  } catch {
    // Unresolvable: the browser would fail too, and we cannot vouch for it.
    return true;
  }
}

async function isFileAllowed(url: URL, roots: Array<string>): Promise<boolean> {
  // file://server/share is a network path (SMB), never a local file
  if (
    roots.length === 0 ||
    (url.hostname !== '' && url.hostname !== 'localhost')
  ) {
    return false;
  }

  let path: string;
  try {
    path = fileURLToPath(url);
  } catch {
    return false;
  }

  // Missing file: nothing to leak, but resolve its closest existing ancestor
  // so symlinks (e.g. macOS /var -> /private/var) match the resolved roots.
  const real = async (candidate: string) => {
    const missing: Array<string> = [];
    let current = resolve(candidate);
    for (;;) {
      try {
        return join(await promises.realpath(current), ...missing);
      } catch {
        const parent = dirname(current);
        if (parent === current) return resolve(candidate);
        missing.unshift(basename(current));
        current = parent;
      }
    }
  };

  const target = await real(path);
  for (const root of roots) {
    const rel = relative(await real(root), target);
    if (rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))) {
      return true;
    }
  }
  return false;
}

/** Decides whether the browser may fetch `rawUrl`. */
export async function isRequestAllowed(
  rawUrl: string,
  options: PdfSecurityOptions,
): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }

  switch (url.protocol) {
    case 'about:':
    case 'data:':
    case 'blob:':
      return true;
    case 'file:':
      return isFileAllowed(url, options.allowedFileRoots ?? []);
    case 'http:':
    case 'https:': {
      if (options.allowedHosts) {
        return options.allowedHosts.some((pattern) =>
          hostMatches(url.hostname, pattern),
        );
      }
      if (options.blockPrivateNetworks === false) {
        return true;
      }
      return !(await resolvesToPrivateAddress(url.hostname));
    }
    default:
      return false;
  }
}

/** Logs the origin and path only: query strings may carry secrets. */
function describe(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    return `${url.origin === 'null' ? `${url.protocol}//` : url.origin}${url.pathname}`;
  } catch {
    return '<invalid url>';
  }
}

/**
 * Filters every request the page (and its frames) makes, redirects included,
 * and closes the pop-ups a script could open to escape the filter.
 */
export async function installRequestGuard(
  context: BrowserContext,
  page: Page,
  options: PdfSecurityOptions,
) {
  context.on('targetcreated', (target) => {
    if (target.type() === TargetType.PAGE && target.opener()) {
      void target
        .page()
        .then((popup) => popup?.close())
        .catch(() => undefined);
    }
  });

  if (options.javascriptEnabled === false) {
    await page.setJavaScriptEnabled(false);
  }

  await page.setRequestInterception(true);
  page.on('request', (request: HTTPRequest) => {
    void (async () => {
      if (request.isInterceptResolutionHandled()) return;
      const url = request.url();
      const allowed = await isRequestAllowed(url, options).catch(() => false);
      if (request.isInterceptResolutionHandled()) return;
      if (allowed) {
        await request.continue();
      } else {
        Logger.warn(`Blocked request to ${describe(url)}`, 'NestJsPdf');
        await request.abort('blockedbyclient');
      }
    })().catch(() => undefined);
  });
}
