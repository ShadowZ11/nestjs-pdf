import { Test, TestingModule } from '@nestjs/testing';
import { NestjsPdfModule } from '@/nestjs-pdf.module';
import { NestjsPdfService } from '@/nestjs-pdf.service';

describe('NestjsPdfModule (e2e)', () => {
  let moduleFixture: TestingModule;

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [
        NestjsPdfModule.forRoot({
          headless: true,
        }),
      ],
    }).compile();
  });

  it('should resolve NestjsPdfService', () => {
    const service = moduleFixture.get(NestjsPdfService);

    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(NestjsPdfService);
  });

  afterEach(async () => {
    await moduleFixture.close();
  });
});
