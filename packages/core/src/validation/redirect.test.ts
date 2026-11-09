import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./redirect";

describe("safeRedirectPath", () => {
  it.each([
    ["/panel", "/panel"],
    ["/panel/restaurantes/123/platos", "/panel/restaurantes/123/platos"],
    ["/panel?tab=platos#alergenos", "/panel?tab=platos#alergenos"],
    ["/nueva-contrasena", "/nueva-contrasena"],
  ])("acepta la ruta interna %j", (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });

  it.each([
    ["URL absoluta a otro dominio", "https://evil.example/panel"],
    ["URL absoluta http", "http://evil.example"],
    ["URL sin protocolo", "//evil.example/panel"],
    ["barra invertida", "/\\evil.example"],
    ["barra y barra invertida", "\\/evil.example"],
    ["javascript:", "javascript:alert(1)"],
    ["data:", "data:text/html,hola"],
    ["ruta relativa", "panel"],
    ["vacío", ""],
    ["espacios y URL externa", "  https://evil.example"],
    ["tabulador oculto", "/\t/evil.example"],
    ["null", null],
    ["undefined", undefined],
    ["número", 42],
  ])("rechaza %s y devuelve la ruta por defecto", (_, input) => {
    expect(safeRedirectPath(input)).toBe("/panel");
  });

  it("permite elegir la ruta por defecto", () => {
    expect(safeRedirectPath("https://evil.example", "/login")).toBe("/login");
  });

  it("nunca devuelve algo que salga del propio sitio", () => {
    for (const input of ["/%2F%2Fevil.example", "/./../evil.example", "/panel/../../x"]) {
      const result = safeRedirectPath(input);
      expect(result.startsWith("/")).toBe(true);
      expect(result[1]).not.toBe("/");
      expect(result[1]).not.toBe("\\");
    }
  });
});
