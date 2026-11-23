import { describe, expect, it } from "vitest";
import { extractMenuJson } from "./json";

const MENU = { dishes: [{ name: "Gambas", price: "12,50 €" }] };

describe("extractMenuJson", () => {
  it("lee una respuesta que es solo el JSON", () => {
    expect(extractMenuJson(JSON.stringify(MENU))).toEqual(MENU);
  });

  it("ignora el texto de antes y de después, aunque tenga llaves", () => {
    const content = `<think>Leo {la carta} con cuidado</think>\nAquí está: ${JSON.stringify(MENU)}\nNota: {fin}`;
    expect(extractMenuJson(content)).toEqual(MENU);
  });

  it("salta objetos que no son la carta y se queda con el que tiene dishes", () => {
    const content = `{"nota":"antes"} ${JSON.stringify(MENU)} {"dishes":"otro"}`;
    expect(extractMenuJson(content)).toEqual(MENU);
  });

  it("no se confunde con llaves y comillas dentro de los textos", () => {
    const menu = {
      dishes: [{ name: 'Tosta "especial" {de la casa}', description: "con \\ barra" }],
    };
    expect(extractMenuJson(`Respuesta: ${JSON.stringify(menu)}`)).toEqual(menu);
  });

  it("una llave suelta dentro de un texto no corta el objeto", () => {
    const content = '{"dishes":[{"name":"Tosta } rara"}]}';
    expect(extractMenuJson(content)).toEqual({ dishes: [{ name: "Tosta } rara" }] });
  });

  it("una comilla escapada no cierra el texto", () => {
    const content = String.raw`{"dishes":[{"name":"Tosta \"} rara"}]}`;
    expect(extractMenuJson(content)).toEqual({ dishes: [{ name: 'Tosta "} rara' }] });
  });

  it("una barra escapada al final del texto sí lo cierra", () => {
    const content = String.raw`{"dishes":[{"name":"C:\\"}]} {"x":1}`;
    expect(extractMenuJson(content)).toEqual({ dishes: [{ name: "C:\\" }] });
  });

  it("un objeto roto antes no impide leer el bueno", () => {
    expect(extractMenuJson(`{"dishes": [ roto } ${JSON.stringify(MENU)}`)).toEqual(MENU);
  });

  it("acepta una carta sin platos", () => {
    expect(extractMenuJson('{"dishes":[]}')).toEqual({ dishes: [] });
  });

  it.each([
    ["", "vacío"],
    ["no hay JSON aquí", "sin llaves"],
    ['{"dishes": [', "sin cerrar"],
    ['{"platos": []}', "sin dishes"],
    ['{"dishes": "no es una lista"}', "dishes que no es una lista"],
    ["[1, 2]", "una lista"],
    ['"}{"', "llaves sueltas dentro de un texto"],
  ])("devuelve null si no hay carta (%j: %s)", (content) => {
    expect(extractMenuJson(content)).toBeNull();
  });
});
