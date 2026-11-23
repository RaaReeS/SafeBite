import "server-only";

/** Como mucho, páginas de un PDF de las que se saca el texto. */
const MAX_PDF_PAGES = 10;

/**
 * Texto de un PDF (en el servidor, con PDF.js). Un PDF escaneado no tiene
 * texto: devuelve una cadena vacía y la página explica que se suba el archivo.
 */
export async function pdfText(data: Uint8Array): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = pdfjs.getDocument({
    data,
    useSystemFonts: false,
    disableFontFace: true,
    verbosity: 0,
  });
  try {
    const pdf = await task.promise;
    const pages: string[] = [];
    for (let number = 1; number <= Math.min(pdf.numPages, MAX_PDF_PAGES); number += 1) {
      const page = await pdf.getPage(number);
      const content = await page.getTextContent();
      pages.push(
        content.items
          .map((item) => ("str" in item ? `${item.str}${item.hasEOL ? "\n" : " "}` : ""))
          .join(""),
      );
    }
    return pages.join("\n").trim();
  } catch {
    return "";
  } finally {
    await task.destroy();
  }
}
