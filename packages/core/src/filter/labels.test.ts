import { describe, expect, it } from "vitest";
import {
  FILTER_DISCLAIMER,
  FILTER_EMPTY_PROFILE_HINT,
  FILTER_SOURCE_NOTICE,
  FILTER_STATUS_LABELS,
} from "./labels";
import { FILTER_STATUSES } from "./status";

const allTexts = (): string[] =>
  Object.values(FILTER_STATUS_LABELS)
    .flatMap((byStatus) =>
      Object.values(byStatus).flatMap((label) => [label.short, label.description]),
    )
    .concat(Object.values(FILTER_DISCLAIMER))
    .concat(Object.values(FILTER_SOURCE_NOTICE))
    .concat(Object.values(FILTER_EMPTY_PROFILE_HINT));

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

describe("textos del filtro", () => {
  it("tiene etiqueta corta y descripción no vacías para cada estado", () => {
    for (const status of FILTER_STATUSES) {
      expect(FILTER_STATUS_LABELS.es[status].short.trim()).not.toBe("");
      expect(FILTER_STATUS_LABELS.es[status].description.trim()).not.toBe("");
    }
  });

  it("tiene un mensaje no vacío para cuando el perfil está vacío", () => {
    expect(FILTER_EMPTY_PROFILE_HINT.es.trim()).not.toBe("");
  });

  it("incluye el aviso obligatorio literal", () => {
    expect(FILTER_DISCLAIMER.es).toBe(
      "Confirma siempre con el establecimiento y revisa la etiqueta física.",
    );
  });

  it("indica que la información la declara el establecimiento", () => {
    expect(normalize(FILTER_SOURCE_NOTICE.es)).toContain("declarada por el establecimiento");
  });

  // Regla crítica 5: lenguaje responsable.
  it.each(["garantiz", "segur", "100", "sin riesgo", "certificad"])(
    'ningún texto contiene "%s"',
    (forbidden) => {
      for (const text of allTexts()) {
        expect(normalize(text)).not.toContain(forbidden);
      }
    },
  );
});
