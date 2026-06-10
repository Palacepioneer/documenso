import pMap from 'p-map';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { Canvas, Image, Path2D } from 'skia-canvas';

// @ts-expect-error napi-rs/canvas satisfies the requirements
globalThis.Path2D = Path2D;
// @ts-expect-error napi-rs/canvas satisfies the requirements
globalThis.Image = Image;

class SkiaCanvasFactory {
  _createCanvas(width: number, height: number) {
    const canvas = new Canvas(width, height);
    canvas.gpu = false;

    return canvas;
  }

  create(width: number, height: number) {
    const canvas = this._createCanvas(width, height);

    return {
      canvas,
      context: canvas.getContext('2d'),
    };
  }

  reset(canvasAndContext: { canvas: Canvas }, width: number, height: number) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext: { canvas: Canvas | null; context: unknown }) {
    if (canvasAndContext.canvas) {
      canvasAndContext.canvas.width = 0;
      canvasAndContext.canvas.height = 0;
    }

    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

export type PdfToImagesOptions = {
  scale?: number;
};

export const pdfToImages = async (pdfBytes: Uint8Array, options: PdfToImagesOptions = {}) => {
  const { scale = 2 } = options;

  const task = await pdfjsLib.getDocument({
    data: pdfBytes,
    CanvasFactory: SkiaCanvasFactory,
  });

  const pdf = await task.promise;

  const images = await pMap(
    Array.from({ length: pdf.numPages }),
    async (_, index) => {
      const pageNumber = index + 1;
      const page = await pdf.getPage(pageNumber);

      const viewport = page.getViewport({ scale });

      const canvas = new Canvas(viewport.width, viewport.height);
      canvas.gpu = false;

      const canvasContext = canvas.getContext('2d');

      await page.render({
        // @ts-expect-error napi-rs/canvas satifies the requirements
        canvas,
        // @ts-expect-error napi-rs/canvas satifies the requirements
        canvasContext,
        viewport,
      }).promise;

      const result = {
        pageNumber,
        image: await canvas.toBuffer('jpeg'),
        width: Math.floor(viewport.width),
        height: Math.floor(viewport.height),
        mimeType: 'image/jpeg',
      };

      void page.cleanup();

      return result;
    },
    { concurrency: 10 },
  );

  void pdf.destroy().catch((e) => console.error(e));
  void task.destroy().catch((e) => console.error(e));

  return images;
};

export type PdfFirstPageToPngOptions = {
  /** Width of the output PNG in pixels. */
  targetWidth?: number;
};

/**
 * Jess fork: render page 1 of a PDF to a PNG at a fixed output width.
 * Used for the document-preview hero embedded in signing emails.
 */
export const pdfFirstPageToPng = async (pdfBytes: Uint8Array, options: PdfFirstPageToPngOptions = {}) => {
  const { targetWidth = 600 } = options;

  const task = await pdfjsLib.getDocument({
    data: pdfBytes,
    CanvasFactory: SkiaCanvasFactory,
  });

  const pdf = await task.promise;

  try {
    const page = await pdf.getPage(1);

    const baseViewport = page.getViewport({ scale: 1 });
    const scale = targetWidth / baseViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = new Canvas(viewport.width, viewport.height);
    canvas.gpu = false;

    const canvasContext = canvas.getContext('2d');

    // Paint a white sheet first so transparent PDF backgrounds render as paper.
    canvasContext.fillStyle = '#FFFFFF';
    canvasContext.fillRect(0, 0, viewport.width, viewport.height);

    await page.render({
      // @ts-expect-error skia-canvas satisfies the requirements
      canvas,
      // @ts-expect-error skia-canvas satisfies the requirements
      canvasContext,
      viewport,
    }).promise;

    const result = {
      image: await canvas.toBuffer('png'),
      width: Math.floor(viewport.width),
      height: Math.floor(viewport.height),
      mimeType: 'image/png',
    };

    void page.cleanup();

    return result;
  } finally {
    void pdf.destroy().catch((e) => console.error(e));
    void task.destroy().catch((e) => console.error(e));
  }
};
