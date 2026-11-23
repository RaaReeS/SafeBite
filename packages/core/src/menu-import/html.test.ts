import { describe, expect, it } from "vitest";
import { htmlToText } from "./html";

describe("htmlToText", () => {
  it("saca el texto de la carta, con un salto por bloque", () => {
    const html = `<!doctype html><html><head><title>Bar Pepe</title><style>.a{color:red}</style></head>
      <body><h1>Carta</h1><ul><li>Gambas al ajillo <b>12,50&nbsp;&euro;</b></li><li>Croquetas</li></ul>
      <p>Postres<br>Flan</p><div>Tarta</div></body></html>`;
    expect(htmlToText(html)).toBe(
      "Carta\nGambas al ajillo 12,50 €\nCroquetas\nPostres\nFlan\nTarta",
    );
  });

  it("quita scripts, estilos, comentarios y otros bloques que no son texto", () => {
    const html = `<p>Sopa</p><script>var carta = "no";</script><noscript>Activa JS</noscript>
      <!-- comentario --><svg><text>dibujo</text></svg><template><p>plantilla</p></template>
      <style>p{}</style><iframe src="x">marco</iframe><p>Pan</p>`;
    expect(htmlToText(html)).toBe("Sopa\nPan");
  });

  it("descodifica las entidades habituales y numéricas", () => {
    expect(
      htmlToText(
        "<p>Jam&oacute;n &amp; queso &lt;3 &quot;caseros&quot; &#39;ok&#39; &#241;&#xF1; &Aacute;&Eacute;&Iacute;&Oacute;&Uacute;&Ntilde;&uuml;&iexcl;&iquest;&apos;</p>",
      ),
    ).toBe("Jamón & queso <3 \"caseros\" 'ok' ññ ÁÉÍÓÚÑü¡¿'");
  });

  it("descodifica el resto de entidades con nombre y el hexadecimal en mayúscula", () => {
    expect(
      htmlToText("<p>&gt;&aacute;&eacute;&iacute;&uacute;&ntilde; &#XF1; &#x10FFFF;</p>"),
    ).toBe(`>áéíúñ ñ ${String.fromCodePoint(0x10ffff)}`);
  });

  it("separa también encabezados, bloques con atributos y elementos ocultos", () => {
    expect(htmlToText("Entrantes<h2>Postres</h2>Flan")).toBe("Entrantes\nPostres\nFlan");
    expect(htmlToText('<span>Uno</span><p class="x">Dos</p>')).toBe("Uno\nDos");
    expect(htmlToText("Uno<script>x</script>Dos")).toBe("Uno\nDos");
  });

  it("quita los comentarios aunque lleven «>» dentro", () => {
    expect(htmlToText("<p>Pan<!-- precio > 5 --></p>")).toBe("Pan");
  });

  it("deja tal cual las entidades desconocidas o imposibles", () => {
    expect(htmlToText("<p>&foo; &#99999999; &#x110000;</p>")).toBe("&foo; &#99999999; &#x110000;");
  });

  it("une espacios y quita líneas vacías", () => {
    expect(
      htmlToText("<p>  Gambas \n\t al   ajillo </p>\n\n<p></p><p>   </p><td>a</td><td>b</td>"),
    ).toBe("Gambas al ajillo\na b");
  });

  it("una página sin texto da una cadena vacía", () => {
    expect(
      htmlToText("<html><body><div id='app'></div><script>render()</script></body></html>"),
    ).toBe("");
  });
});
