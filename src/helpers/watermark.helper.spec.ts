import { PDFDocument, PDFPage } from 'pdf-lib';
import { vi } from 'vitest';

import { NestjsPdfErrorCode, WatermarkException } from '../exceptions';
import { addWatermark } from './watermark.helper';

// 1x1 transparent PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

async function makePdf(sizes: Array<[number, number]> = [[600, 800]]) {
  const pdfDoc = await PDFDocument.create();
  for (const size of sizes) pdfDoc.addPage(size);
  return pdfDoc.save();
}

describe('watermark.helper', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stamps a centered text on every page by default', async () => {
    const drawText = vi.spyOn(PDFPage.prototype, 'drawText');
    const bytes = await makePdf([
      [600, 800],
      [600, 800],
    ]);

    const result = await addWatermark(bytes, { text: 'CONFIDENTIAL' });

    expect(drawText).toHaveBeenCalledTimes(2);
    expect(drawText).toHaveBeenCalledWith(
      'CONFIDENTIAL',
      expect.objectContaining({ opacity: 0.15, size: 60 }),
    );
    const out = await PDFDocument.load(result);
    expect(out.getPageCount()).toBe(2);
    expect(result.length).toBeGreaterThan(bytes.length);
  });

  it.each([0, 45, 90, -30])(
    'keeps the center of the text on the page center (rotation %i°)',
    async (rotation) => {
      const drawText = vi.spyOn(PDFPage.prototype, 'drawText');
      const doc = await PDFDocument.create();
      const font = await doc.embedFont('Helvetica-Bold');
      const width = font.widthOfTextAtSize('CENTER', 60);
      const height = font.heightAtSize(60, { descender: false });

      await addWatermark(await makePdf(), { text: 'CENTER', rotation });

      const { x, y } = drawText.mock.calls[0][1]!;
      const theta = (rotation * Math.PI) / 180;
      const centerX =
        x! + (width / 2) * Math.cos(theta) - (height / 2) * Math.sin(theta);
      const centerY =
        y! + (width / 2) * Math.sin(theta) + (height / 2) * Math.cos(theta);
      expect(centerX).toBeCloseTo(300);
      expect(centerY).toBeCloseTo(400);
    },
  );

  it('only stamps the requested pages', async () => {
    const drawText = vi.spyOn(PDFPage.prototype, 'drawText');
    const bytes = await makePdf([
      [600, 800],
      [600, 800],
      [600, 800],
    ]);

    await addWatermark(bytes, { text: 'DRAFT', pages: [2, 2, 3] });

    expect(drawText).toHaveBeenCalledTimes(2);
  });

  it('repeats the mark across the page in tile mode', async () => {
    const drawText = vi.spyOn(PDFPage.prototype, 'drawText');

    await addWatermark(await makePdf(), {
      text: 'DRAFT',
      fontSize: 30,
      position: 'tile',
      tileSpacing: 40,
    });

    expect(drawText.mock.calls.length).toBeGreaterThan(4);
  });

  it('supports PNG images', async () => {
    const drawImage = vi.spyOn(PDFPage.prototype, 'drawImage');

    const result = await addWatermark(await makePdf(), {
      image: PNG,
      imageWidth: 100,
    });

    expect(drawImage).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ width: 100, height: 100 }),
    );
    await expect(PDFDocument.load(result)).resolves.toBeDefined();
  });

  it('defaults the image width to half of the page width', async () => {
    const drawImage = vi.spyOn(PDFPage.prototype, 'drawImage');

    await addWatermark(await makePdf(), { image: PNG });

    expect(drawImage).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ width: 300 }),
    );
  });

  it('supports JPEG images', async () => {
    const embedJpg = vi
      .spyOn(PDFDocument.prototype, 'embedJpg')
      .mockResolvedValue({ width: 2, height: 1 } as never);
    vi.spyOn(PDFPage.prototype, 'drawImage').mockImplementation(
      () => undefined,
    );

    await addWatermark(await makePdf(), {
      image: new Uint8Array([0xff, 0xd8, 0xff]),
    });

    expect(embedJpg).toHaveBeenCalled();
  });

  it('rejects images that are neither PNG nor JPEG', async () => {
    await expect(
      addWatermark(await makePdf(), { image: new Uint8Array([1, 2, 3]) }),
    ).rejects.toThrow('PNG or JPEG');
  });

  it.each(['#f00', '#FF0000'])('accepts the color %s', async (color) => {
    const drawText = vi.spyOn(PDFPage.prototype, 'drawText');

    await addWatermark(await makePdf(), { text: 'A', color });

    expect(drawText.mock.calls[0][1]!.color).toMatchObject({
      red: 1,
      green: 0,
      blue: 0,
    });
  });

  it.each([
    [{}, 'text` or an `image'],
    [{ text: 'A', opacity: 2 }, 'opacity'],
    [{ text: 'A', fontSize: 0 }, 'fontSize'],
    [{ text: 'A', imageWidth: -1 }, 'imageWidth'],
    [{ text: 'A', tileSpacing: -1 }, 'tileSpacing'],
    [{ text: 'A', color: 'red' }, 'color'],
    [{ text: 'A', pages: [0] }, 'out of range'],
    [{ text: 'A', pages: [3] }, 'out of range'],
    [{ text: 'A', pages: [1.5] }, 'out of range'],
  ])('rejects invalid options %j', async (options, message) => {
    const promise = addWatermark(await makePdf(), options);

    await expect(promise).rejects.toBeInstanceOf(WatermarkException);
    await expect(promise).rejects.toThrow(message);
  });

  it('exposes the WATERMARK_ERROR code', async () => {
    await expect(addWatermark(await makePdf(), {})).rejects.toMatchObject({
      code: NestjsPdfErrorCode.WATERMARK_ERROR,
    });
  });

  it('rejects text that the standard fonts cannot encode', async () => {
    await expect(
      addWatermark(await makePdf(), { text: '机密' }),
    ).rejects.toThrow('WinAnsi');
  });

  it('wraps non-Error failures', async () => {
    const bytes = await makePdf();
    vi.spyOn(PDFDocument.prototype, 'save').mockRejectedValue('boom');

    await expect(addWatermark(bytes, { text: 'A' })).rejects.toThrow(
      'Failed to add watermark: boom',
    );
  });

  it('wraps failures on invalid PDF input', async () => {
    const error = await addWatermark(new Uint8Array([1, 2, 3]), {
      text: 'A',
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(WatermarkException);
    expect((error as WatermarkException).cause).toBeDefined();
  });
});
