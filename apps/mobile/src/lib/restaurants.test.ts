import { escapeLikePattern, isTooManyRequestsError } from "./restaurants";

describe("escapeLikePattern", () => {
  it.each([
    ["Madrid", "Madrid"],
    ["100%", "100\\%"],
    ["san_sebastian", "san\\_sebastian"],
    ["a\\b", "a\\\\b"],
  ])("%j -> %j", (input, expected) => {
    expect(escapeLikePattern(input)).toBe(expected);
  });
});

describe("isTooManyRequestsError", () => {
  it("reconoce solo el error de límite de la base de datos", () => {
    expect(isTooManyRequestsError({ code: "SB429", message: "x" })).toBe(true);
    expect(isTooManyRequestsError({ code: "42501" })).toBe(false);
    expect(isTooManyRequestsError(new Error("SB429"))).toBe(false);
    expect(isTooManyRequestsError(null)).toBe(false);
    expect(isTooManyRequestsError("SB429")).toBe(false);
  });
});
