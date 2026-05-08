import { Test, TestingModule } from '@nestjs/testing';
import { PdfLibService } from './pdf-lib.service';

describe('PdfLibService', () => {
  let service: PdfLibService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfLibService],
    }).compile();

    service = module.get<PdfLibService>(PdfLibService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
