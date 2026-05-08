import { Test, TestingModule } from '@nestjs/testing';
import { NestjsPdfService } from './nestjs-pdf.service';

describe('NestjsPdfService', () => {
  let service: NestjsPdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NestjsPdfService],
    }).compile();

    service = module.get<NestjsPdfService>(NestjsPdfService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
