import { assertEquals } from "jsr:@std/assert";
import { merge } from "./recursion.ts";

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