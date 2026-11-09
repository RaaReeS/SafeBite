import { describe, expect, it } from "vitest";
import {
  FILTER_STATUSES,
  compareStatus,
  isFilterStatus,
  mostSevereStatus,
  type FilterStatus,
} from "./status";

describe("FILTER_STATUSES", () => {
  it("lista los 4 estados de más a menos grave", () => {
    expect(FILTER_STATUSES).toEqual(["no_apto", "posibles_trazas", "sin_datos", "apto"]);
  });
});

describe("isFilterStatus", () => {
  it("acepta los 4 estados", () => {
    for (const status of FILTER_STATUSES) {
      expect(isFilterStatus(status)).toBe(true);
    }
  });

  it.each(["", "Apto", "safe", "suitable", "seguro", null, undefined, 1])("rechaza %j", (value) => {
    expect(isFilterStatus(value)).toBe(false);
  });
});

describe("compareStatus", () => {
  it("ordena de menos a más grave (los aptos primero)", () => {
    const statuses: FilterStatus[] = ["no_apto", "apto", "sin_datos", "posibles_trazas", "apto"];
    expect([...statuses].sort(compareStatus)).toEqual([
      "apto",
      "apto",
      "sin_datos",
      "posibles_trazas",
      "no_apto",
    ]);
  });

  it("devuelve 0 para el mismo estado", () => {
    for (const status of FILTER_STATUSES) {
      expect(compareStatus(status, status)).toBe(0);
    }
  });

  it("respeta la prioridad no_apto > posibles_trazas > sin_datos > apto", () => {
    expect(compareStatus("no_apto", "posibles_trazas")).toBeGreaterThan(0);
    expect(compareStatus("posibles_trazas", "sin_datos")).toBeGreaterThan(0);
    expect(compareStatus("sin_datos", "apto")).toBeGreaterThan(0);
    expect(compareStatus("apto", "no_apto")).toBeLessThan(0);
  });
});

describe("mostSevereStatus", () => {
  it("devuelve el estado más grave", () => {
    expect(mostSevereStatus(["apto", "sin_datos"])).toBe("sin_datos");
    expect(mostSevereStatus(["sin_datos", "posibles_trazas", "apto"])).toBe("posibles_trazas");
    expect(mostSevereStatus(["apto", "no_apto", "posibles_trazas"])).toBe("no_apto");
    expect(mostSevereStatus(["apto", "apto"])).toBe("apto");
  });

  it("con una lista vacía devuelve sin_datos, nunca apto", () => {
    expect(mostSevereStatus([])).toBe("sin_datos");
  });
});
