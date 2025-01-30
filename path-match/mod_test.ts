import { assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";
import { BasePathMatcher, PathMatchResult } from "./mod.ts";

/**
 * Helper function to create an expected PathMatchResult.
 */
function createExpectedResult(
  path: string,
  params: Record<string, string | string[]>,
  wildcard: string[],
  matched: boolean,
): PathMatchResult {
  return new PathMatchResult(path, params, wildcard, matched);
}

/**
 * Test suite for BasePathMatcher
 */
Deno.test("BasePathMatcher: Static path exact match", () => {
  const matcher = new BasePathMatcher("/some/path");
  const result = matcher.match("/some/path");
  const expected = createExpectedResult("/some/path", {}, [], true);
  assertEquals(result, expected);
});

Deno.test("BasePathMatcher: Static path with trailing slash", () => {
  const matcher = new BasePathMatcher("/some/path");
  const result = matcher.match("/some/path/");
  const expected = createExpectedResult("/some/path", {}, [], true);
  assertEquals(result, expected);
});

Deno.test("BasePathMatcher: Static path mismatch", () => {
  const matcher = new BasePathMatcher("/some/path");
  const result = matcher.match("/some/other");
  const expected = createExpectedResult("/some/other", {}, [], false);
  assertEquals(result, expected);
});

Deno.test("BasePathMatcher: Single parameter capture", () => {
  const matcher = new BasePathMatcher("/users/:id");
  const result = matcher.match("/users/123");
  const expected = createExpectedResult("/users/123", { id: "123" }, [], true);
  assertEquals(result, expected);
});

Deno.test("BasePathMatcher: Single parameter with range", () => {
  const matcher = new BasePathMatcher("/users/:id[a-z0-9]");
  const result = matcher.match("/users/abc123");
  const expected = createExpectedResult("/users/abc123", { id: "abc123" }, [], true);
  assertEquals(result, expected);
});

Deno.test("BasePathMatcher: Single parameter with range mismatch", () => {
  const matcher = new BasePathMatcher("/users/:id[a-z0-9]");
  const result = matcher.match("/users/abc-123");
  const expected = createExpectedResult("/users/abc-123", {}, [], false);
  assertEquals(result, expected);
});

Deno.test("BasePathMatcher: Multi parameter capture", () => {
  const matcher = new BasePathMatcher("/users/:id/:action");
  const result = matcher.match("/users/123/edit");
  const expected = createExpectedResult("/users/123/edit", { id: "123", action: "edit" }, [], true);
  assertEquals(result, expected);
});

Deno.test("BasePathMatcher: Wildcard `*` captures single segment", () => {
  const matcher = new BasePathMatcher("/files/*");
  const result = matcher.match("/files/document.pdf");
  const expected = createExpectedResult("/files/document.pdf", {}, ["document.pdf"], true);
  assertEquals(result, expected);
});

Deno.test("BasePathMatcher: Wildcard `*` with multiple segments fails", () => {
  const matcher = new BasePathMatcher("/files/*");
  const result = matcher.match("/files/documents/2023");
  const expected = createExpectedResult("/files/documents/2023", {}, [], false);
  assertEquals(result, expected);
});

Deno.test("BasePathMatcher: Wildcard `**` captures multiple segments", () => {
  const matcher = new BasePathMatcher("/files/**");
  const result = matcher.match("/files/documents/2023/report.pdf");
  const expected = createExpectedResult("/files/documents/2023/report.pdf", {}, ["documents", "2023", "report.pdf"], true);
  assertEquals(result, expected);
});

Deno.test("BasePathMatcher: Named wildcard `:path**` captures multiple segments", () => {
  const matcher = new BasePathMatcher("/files/:path**");
  const result = matcher.match("/files/documents/2023/report.pdf");
  const expected = createExpectedResult(
    "/files/documents/2023/report.pdf",
    { path: ["documents", "2023", "report.pdf"] },
    [],
    true,
  );
  assertEquals(result, expected);
});

Deno.test("BasePathMatcher: Optional parameter present", () => {
  const matcher = new BasePathMatcher("/users/:id?");
  const result = matcher.match("/users/123");
  const expected = createExpectedResult("/users/123", { id: "123" }, [], true);
  assertEquals(result, expected);
});

Deno.test("BasePathMatcher: Optional parameter absent", () => {
  const matcher = new BasePathMatcher("/users/:id?");
  const result = matcher.match("/users");
  const expected = createExpectedResult("/users", {}, [], true);
  assertEquals(result, expected);
});

Deno.test("BasePathMatcher: Optional wildcard present", () => {
  const matcher = new BasePathMatcher("/files/?");
  const result = matcher.match("/files/document.pdf");
  const expected = createExpectedResult("/files/document.pdf", {}, ["document.pdf"], true);
  assertEquals(result, expected);
});

Deno.test("BasePathMatcher: Optional wildcard absent", () => {
  const matcher = new BasePathMatcher("/files/?");
  const result = matcher.match("/files");
  const expected = createExpectedResult("/files", {}, [], true);
  assertEquals(result, expected);
});

Deno.test("BasePathMatcher: Combined parameters and wildcards", () => {
  const matcher = new BasePathMatcher("/users/:id/files/**");
  const result = matcher.match("/users/123/files/documents/2023/report.pdf");
  const expected = createExpectedResult(
    "/users/123/files/documents/2023/report.pdf",
    { id: "123" },
    ["documents", "2023", "report.pdf"],
    true,
  );
  assertEquals(result, expected);
});

Deno.test("BasePathMatcher: Plus operator `+` captures multiple segments as string", () => {
  const matcher = new BasePathMatcher("/search/:query+");
  const result = matcher.match("/search/deno/typeScript/matchers");
  const expected = createExpectedResult(
    "/search/deno/typescript/matchers",
    { query: "deno/typescript/matchers" },
    [],
    true,
  );
  assertEquals(result, expected);
});

Deno.test("BasePathMatcher: Range wildcard `[a-z]**` captures multiple segments", () => {
  const matcher = new BasePathMatcher("/alpha/[a-z]**");
  const result = matcher.match("/alpha/one/two/three");
  const expected = createExpectedResult("/alpha/one/two/three", {}, ["one", "two", "three"], true);
  assertEquals(result, expected);
});

Deno.test("BasePathMatcher: Range wildcard `[0-9]**` captures multiple numeric segments", () => {
  const matcher = new BasePathMatcher("/numbers/[0-9]**");
  const result = matcher.match("/numbers/123/456/789");
  const expected = createExpectedResult("/numbers/123/456/789", {}, ["123", "456", "789"], true);
  assertEquals(result, expected);
});

Deno.test("BasePathMatcher: Range wildcard `[0-9]**` with mismatch", () => {
  const matcher = new BasePathMatcher("/numbers/[0-9]**");
  const result = matcher.match("/numbers/123/abc/789");
  const expected = createExpectedResult("/numbers/123/abc/789", {}, [], false);
  assertEquals(result, expected);
});

Deno.test("BasePathMatcher: Edge case with repeated parameter names throws", () => {
  assertThrows(() => {
    new BasePathMatcher("/users/:id/:id");
  }, Error, "Duplicate parameter name: id");
});

Deno.test("BasePathMatcher: Trailing slashes are normalized", () => {
  const matcher = new BasePathMatcher("/some/path/");
  const result = matcher.match("/some/path");
  const expected = createExpectedResult("/some/path", {}, [], true);
  assertEquals(result, expected);
});

Deno.test("BasePathMatcher: Matching root path", () => {
  const matcher = new BasePathMatcher("/");
  const result = matcher.match("/");
  const expected = createExpectedResult("/", {}, [], true);
  assertEquals(result, expected);
});

Deno.test("BasePathMatcher: Matching root path with extra segments fails", () => {
  const matcher = new BasePathMatcher("/"); 
  const result = matcher.match("/extra");
  const expected = createExpectedResult("/extra", {}, [], false);
  assertEquals(result, expected);
});