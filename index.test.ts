import { describe, expect, it, test } from "bun:test";

import { blendDefaults, isObject } from "./index";

describe("defaultComposer", () => {
  /* DEFAULT BEHAVIOUR */
  it("should merge two objects", () => {
    const result = blendDefaults({ a: 1, b: 1 }, { c: 2 });
    expect(result).toEqual({ a: 1, b: 1, c: 2 });
  });

  it("should deep merge two objects", () => {
    const result = blendDefaults(
      { a: 1, b: 1, c: { d: 1, e: 1 } },
      { a: 2, c: { d: 2 } }
    );
    expect(result).toEqual({ a: 2, b: 1, c: { d: 2, e: 1 } });
  });

  it("should not merge two arrays by default", () => {
    const result = blendDefaults(
      { a: 1, b: 1, c: [1, 2, 3] },
      { a: 2, b: 2, c: [4, 5, 6] }
    );
    expect(result).toEqual({ a: 2, b: 2, c: [4, 5, 6] });
  });

  /* STRATEGIES */
  it("should use custom handleObject to skip property name", () => {
    const result = blendDefaults(
      {
        a: 1,
        c: { a: "ignore" },
        x: { y: 1, z: 1, c: { a: "ignore" } },
      },
      {
        a: 2,
        c: {},
        x: { y: 2, c: {} },
      },
      {
        strategies: [
          {
            matcher: (match) => match.isObject().pathContains("c"),
            action: (fn) => fn.useOverride(),
          },
        ],
      }
    );
    expect(result).toEqual({
      a: 2,
      c: {},
      x: { y: 2, z: 1, c: {} },
    });
  });

  it("should use custom handleObject to skip property name", () => {
    const result = blendDefaults(
      {
        a: 1,
        c: { a: "don't ignore" },
        x: { y: 1, z: 1, c: { a: "ignore" } },
      },
      {
        a: 2,
        c: {},
        x: { y: 2, c: {} },
      },
      {
        strategies: [
          {
            matcher: (match) => match.isObject().path("x.c"),
            action: (fn) => fn.useOverride(),
          },
        ],
      }
    );
    expect(result).toEqual({
      a: 2,
      c: { a: "don't ignore" },
      x: { y: 2, z: 1, c: {} },
    });
  });

  it("should merge two arrays if strategy is provided", () => {
    const result = blendDefaults(
      { a: 1, b: 1, c: [1, 2, 3] },
      { a: 2, b: 2, c: [4, 5, 6] },
      {
        strategies: [
          {
            matcher: (ctx) => ctx.isArray(),
            action: (fn) => fn.shallowMerge(),
          },
        ],
      }
    );
    expect(result).toEqual({ a: 2, b: 2, c: [1, 2, 3, 4, 5, 6] });
  });
});
