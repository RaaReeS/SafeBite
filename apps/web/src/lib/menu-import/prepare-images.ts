import { MAX_IMAGE_CHARS, MAX_IMAGE_SIDE, MAX_PAGES } from "./limits";

/** Tipos de imagen admitidos (además de PDF). */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ACCEPT = [...IMAGE_TYPES, "application/pdf"].join(",");

/** Error con un mensaje para el usuario (en la clave de i18n `menuImport.prepare`). */
export class PrepareError extends Error {
  constructor(readonly reason: "tooManyPages" | "unsupported" | "unreadable") {
    super(reason);
    this.name = "PrepareError";
  }
}

function scaleFor(width: number, height: number): number {
  return Math.min(1, MAX_IMAGE_SIDE / Math.max(width, height));
}

/** JPEG que cabe en el límite: baja la calidad (y si hace falta, el tamaño) hasta que quepa. */
function toJpeg(source: CanvasImageSource, width: number, height: number): string {
  let side = 1;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * side));
    canvas.height = Math.max(1, Math.round(height * side));
    const context = canvas.getContext("2d");
    if (context === null) throw new PrepareError("unreadable");
    // Fondo blanco: los PNG transparentes no quedan negros en JPEG.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.8, 0.65, 0.5]) {
      const data = canvas.toDataURL("image/jpeg", quality);
      if (data.length <= MAX_IMAGE_CHARS) return data;
    }
    side *= 0.75;
  }
  throw new PrepareError("unreadable");
}

async function imageToJpeg(file: File): Promise<string> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new PrepareError("unreadable");
  }
  const scale = scaleFor(bitmap.width, bitmap.height);
  const jpeg = toJpeg(bitmap, bitmap.width * scale, bitmap.height * scale);
  bitmap.close();
  return jpeg;
}

async function pdfToJpegs(file: File, room: number): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.min.mjs";
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  let pdf;
  try {
    pdf = await task.promise;
  } catch {
    throw new PrepareError("unreadable");
  }
  if (pdf.numPages > room) {
    await task.destroy();
    throw new PrepareError("tooManyPages");
  }
  const pages: string[] = [];
  for (let number = 1; number <= pdf.numPages; number += 1) {
    const page = await pdf.getPage(number);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: scaleFor(base.width, base.height) * 2 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    await page.render({ canvas, viewport }).promise;
    const scale = scaleFor(canvas.width, canvas.height);
    pages.push(toJpeg(canvas, canvas.width * scale, canvas.height * scale));
  }
  await task.destroy();
  return pages;
}

/**
 * Prepara la carta para enviarla: cada página del PDF y cada foto pasan a JPEG
 * de 1600 px como máximo y menos de ~750 KB. Todo en el navegador: no se guarda
 * nada. Más de 5 páginas en total o un formato no admitido, error.
 */
export async function prepareImages(files: readonly File[]): Promise<string[]> {
  if (files.length === 0) throw new PrepareError("unsupported");
  const images: string[] = [];
  for (const file of files) {
    const room = MAX_PAGES - images.length;
    if (room <= 0) throw new PrepareError("tooManyPages");
    if (file.type === "application/pdf") {
      images.push(...(await pdfToJpegs(file, room)));
    } else if ((IMAGE_TYPES as readonly string[]).includes(file.type)) {
      images.push(await imageToJpeg(file));
    } else {
      throw new PrepareError("unsupported");
    }
  }
  return images;
}
