import { escapeLikePattern } from "./restaurants";

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
