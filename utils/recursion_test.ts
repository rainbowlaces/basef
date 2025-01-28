import { assertEquals } from "jsr:@std/assert";
import { merge, recursiveMap } from "./recursion.ts";

Deno.test("merge should override simple properties", () => {
  const base = { a: 1, b: 2 };
  const apply = { b: 3, c: 4 };
  const result = merge(base, apply);

  assertEquals(result, { a: 1, b: 3, c: 4 });
});

Deno.test("merge should recursively merge nested objects", () => {
  const base = { a: 1, b: { c: 2, d: 3 } };
  const apply = { b: { d: 4, e: 5 } };
  const result = merge(base, apply);

  assertEquals(result, { a: 1, b: { c: 2, d: 4, e: 5 } });
});

Deno.test("merge should overwrite arrays instead of merging them", () => {
  const base = { a: [1, 2, 3], b: { c: 2 } };
  const apply = { a: [4, 5], b: { c: [6, 7] } };
  const result = merge(base, apply);

  assertEquals(result, { a: [4, 5], b: { c: [6, 7] } });
});

Deno.test("merge should handle non-object types gracefully", () => {
  const base = { a: 1, b: "string", c: null };
  const apply = { b: 42, c: "new value", d: true };
  const result = merge(base, apply);

  assertEquals(result, { a: 1, b: 42, c: "new value", d: true });
});

Deno.test("merge should not modify the base object", () => {
  const base = { a: 1, b: { c: 2 } };
  const apply = { b: { c: 3 } };
  const result = merge(base, apply);

  assertEquals(base, { a: 1, b: { c: 2 } }); // Base remains unchanged
  assertEquals(result, { a: 1, b: { c: 3 } });
});

Deno.test("merge should handle empty apply object", () => {
  const base = { a: 1, b: 2 };
  const apply = {};
  const result = merge(base, apply);

  assertEquals(result, { a: 1, b: 2 });
});

Deno.test("merge should handle empty base object", () => {
  const base = {};
  const apply = { a: 1, b: 2 };
  const result = merge(base, apply);

  assertEquals(result, { a: 1, b: 2 });
});

Deno.test("merge should handle deeply nested objects", () => {
  const base = { a: { b: { c: { d: 1 } } } };
  const apply = { a: { b: { c: { e: 2 } } } };
  const result = merge(base, apply);

  assertEquals(result, { a: { b: { c: { d: 1, e: 2 } } } });
});

Deno.test("merge should replace non-object values with objects", () => {
  const base = { a: 1 };
  const apply = { a: { b: 2 } };
  const result = merge(base, apply);

  assertEquals(result, { a: { b: 2 } });
});

Deno.test("merge should replace objects with non-object values", () => {
  const base = { a: { b: 2 } };
  const apply = { a: 42 };
  const result = merge(base, apply);

  assertEquals(result, { a: 42 });
});

// Deno.test("recursiveMap should apply a transformer to all values", () => {
//   const input = { a: 1, b: { c: 2, d: 3 } };
//   const transformer = (value: unknown) =>
//     typeof value === "number" ? value * 2 : value;

//   const result = recursiveMap(input, {}, () => transformer);
//   assertEquals(result, { a: 2, b: { c: 4, d: 6 } });
// });

// Deno.test("recursiveMap should handle arrays correctly", () => {
//   const input = { a: [1, 2, 3], b: { c: [4, 5] } };
//   const transformer = (value: unknown) =>
//     typeof value === "number" ? value + 1 : value;

//   const result = recursiveMap(input, {}, () => transformer);
//   assertEquals(result, { a: [2, 3, 4], b: { c: [5, 6] } });
// });

// Deno.test("recursiveMap should respect maxDepth option", () => {
//   const input = { a: { b: { c: { d: 1 } } } };
//   const transformer = (value: unknown) =>
//     typeof value === "number" ? value * 2 : value;

//   const result = recursiveMap(input, { maxDepth: 2 }, () => transformer);
//   assertEquals(result, { a: { b: {} } }); // Stops at depth 2
// });

// Deno.test("recursiveMap should respect maxItems option", () => {
//   const input = { a: 1, b: 2, c: 3 };
//   const transformer = (value: unknown) =>
//     typeof value === "number" ? value * 2 : value;

//   const result = recursiveMap(input, { maxItems: 2 }, () => transformer);
//   assertEquals(result, { a: 2, b: 4 }); // Only processes the first 2 items
// });

// Deno.test("recursiveMap should handle circular references", () => {
//   const input: Record<string, unknown> = { a: 1 };
//   input.b = input; // Circular reference

//   const result = recursiveMap(input, {}, () => null);
//   assertEquals(result, { a: null, b: {} }); // Circular reference resolved to empty object
// });

// Deno.test("recursiveMap should handle transformer returning null", () => {
//   const input = { a: 1, b: { c: 2 } };
//   const transformer = (value: unknown) =>
//     typeof value === "number" && value > 1 ? null : value;

//   const result = recursiveMap(input, {}, () => transformer);
//   assertEquals(result, { a: 1, b: { c: null } });
// });

Deno.test("recursiveMap should handle non-object and non-array input", () => {
  const input = "string";
  const transformer = (value: unknown) =>
    typeof value === "string" ? value.toUpperCase() : value;

  const result = recursiveMap(input, {}, () => transformer);
  assertEquals(result, "STRING");
});

// Deno.test("recursiveMap should work with arrays at the root level", () => {
//   const input = [1, 2, 3];
//   const transformer = (value: unknown) =>
//     typeof value === "number" ? value * 10 : value;

//   const result = recursiveMap(input, {}, () => transformer);
//   assertEquals(result, [10, 20, 30]);
// });