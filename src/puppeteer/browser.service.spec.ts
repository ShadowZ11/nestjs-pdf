import { BrowserService, BrowserTag } from './browser.service';

describe('BrowserService', () => {
  let service: BrowserService;

  beforeEach(() => {
    service = new BrowserService({ cleanupBrowserCacheOnExit: false });
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with default browser tag (LATEST for CHROMIUM)', () => {
      const tag = service.getBrowserTag();
      expect(tag).toBe(BrowserTag.LATEST);
    });

    it('should initialize with CHROMIUM browser', () => {
      const browser = service.getBrowser();
      expect(browser).toBeDefined();
    });
  });

  describe('job tracking', () => {
    it('should increment active and total jobs on markJobStarted', () => {
      service.markJobStarted();
      service.markJobStarted();

      expect(service.activeJobs).toBe(2);
      expect(service.totalJobs).toBe(2);
    });

    it('should request recycle when total jobs reaches 200', () => {
      for (let i = 0; i < 200; i++) {
        service.markJobStarted();
      }

      // Access private property for testing (this is for testing purposes)
      const recycleRequested = (
        service as unknown as { recycleRequested: boolean }
      ).recycleRequested;
      expect(recycleRequested).toBe(true);
    });

    it('should decrement active jobs on markJobFinished', async () => {
      service.markJobStarted();
      service.markJobStarted();
      service.markJobStarted();

      expect(service.activeJobs).toBe(3);

      await service.markJobFinished();

      expect(service.activeJobs).toBe(2);
    });

    it('should not decrement below zero', async () => {
      service.activeJobs = 0;
      await service.markJobFinished();

      expect(service.activeJobs).toBe(0);
    });
  });

  describe('browser tag', () => {
    it('should set and get browser tag', () => {
      service.setBrowserTag(BrowserTag.STABLE);
      expect(service.getBrowserTag()).toBe(BrowserTag.STABLE);
    });

    it('should support all BrowserTag enum values', () => {
      Object.values(BrowserTag).forEach((tag) => {
        service.setBrowserTag(tag);
        expect(service.getBrowserTag()).toBe(tag);
      });
    });
  });

  describe('browser', () => {
    it('should get browser on initialization', () => {
      const currentBrowser = service.getBrowser();
      expect(currentBrowser).toBeDefined();
    });
  });

  describe('build ID', () => {
    it('should get undefined build ID initially', () => {
      const buildId = service.getBuildId();
      expect(buildId).toBeUndefined();
    });

    it('should set and get build ID', () => {
      const testBuildId = '123456789';
      service.setBuildId(testBuildId);
      expect(service.getBuildId()).toBe(testBuildId);
    });

    it('should set build ID to undefined', () => {
      service.setBuildId('test-id');
      service.setBuildId(undefined);
      expect(service.getBuildId()).toBeUndefined();
    });
  });

  describe('active jobs counter', () => {
    it('should track active jobs correctly', () => {
      expect(service.activeJobs).toBe(0);

      service.markJobStarted();
      expect(service.activeJobs).toBe(1);

      service.markJobStarted();
      expect(service.activeJobs).toBe(2);
    });

    it('should track total jobs independently from active jobs', () => {
      service.markJobStarted();
      service.markJobStarted();

      expect(service.activeJobs).toBe(2);
      expect(service.totalJobs).toBe(2);

      service.activeJobs = 0;

      expect(service.activeJobs).toBe(0);
      expect(service.totalJobs).toBe(2);
    });
  });

  describe('onModuleDestroy', () => {
    it('should handle module destruction gracefully', async () => {
      const result = await service.onModuleDestroy();
      expect(result).toBeUndefined();
    });
  });

  describe('cache directory', () => {
    it('should use .cache/puppeteer-browser as cache directory', () => {
      // Access private property for testing (this is for testing purposes)

      const cacheDir = (service as unknown as { cacheDir: string }).cacheDir;
      expect(cacheDir).toContain('.cache');
      expect(cacheDir).toContain('puppeteer-browser');
    });
  });
});

describe('BrowserTag Enum', () => {
  it('should have all expected values', () => {
    expect(BrowserTag.LATEST).toBe('latest');
    expect(BrowserTag.BETA).toBe('beta');
    expect(BrowserTag.DEV).toBe('dev');
    expect(BrowserTag.STABLE).toBe('stable');
    expect(BrowserTag.CANARY).toBe('canary');
  });

  it('should be able to iterate all values', () => {
    const values = Object.values(BrowserTag);
    expect(values).toHaveLength(5);
  });
});
