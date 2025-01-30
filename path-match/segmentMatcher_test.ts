// segmentMatcher_test.ts

import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { PathSegment } from "./pathSegment.ts";
import { SegmentMatcher } from "./segmentMatcher.ts";

/**
 * Test suite for SegmentMatcher
 *
 * Covers:
 * - Static segments
 * - Parameter segments with various modifiers
 * - Wildcard segments with various modifiers
 * - Range constraints
 * - Optional segments
 * - Edge cases
 */

Deno.test("SegmentMatcher: Static segment exact match", () => {
  const pathSegment = new PathSegment("hello");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["hello", "world"];

  const result = matcher.match(uriSegments);
  assertEquals(result, {
    leftover: ["world"],
  });
});

Deno.test("SegmentMatcher: Static segment mismatch", () => {
  const pathSegment = new PathSegment("hello");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["hi", "world"];

  const result = matcher.match(uriSegments);
  assertEquals(result, undefined);
});

Deno.test("SegmentMatcher: Single param matches and captures", () => {
  const pathSegment = new PathSegment(":foo");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["bar", "baz"];

  const result = matcher.match(uriSegments);
  assertEquals(result, {
    leftover: ["baz"],
    paramName: "foo",
    paramValue: "bar",
  });
});

Deno.test("SegmentMatcher: Single param with range matches", () => {
  const pathSegment = new PathSegment(":id[a-z0-9]");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["abc123", "next"];

  const result = matcher.match(uriSegments);
  assertEquals(result, {
    leftover: ["next"],
    paramName: "id",
    paramValue: "abc123",
  });
});

Deno.test("SegmentMatcher: Single param with range mismatch", () => {
  const pathSegment = new PathSegment(":id[a-z0-9]");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["abc-123", "next"];

  const result = matcher.match(uriSegments);
  assertEquals(result, undefined);
});

Deno.test("SegmentMatcher: Multi param captures all segments", () => {
  const pathSegment = new PathSegment(":foo**");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["bar", "baz", "qux"];

  const result = matcher.match(uriSegments);
  assertEquals(result, {
    leftover: [],
    paramName: "foo",
    paramValue: ["bar", "baz", "qux"],
  });
});

Deno.test("SegmentMatcher: MultiString param captures joined segments", () => {
  const pathSegment = new PathSegment(":foo+");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["bar", "baz", "qux"];

  const result = matcher.match(uriSegments);
  assertEquals(result, {
    leftover: [],
    paramName: "foo",
    paramValue: "bar/baz/qux",
  });
});

Deno.test("SegmentMatcher: Optional param present and captured", () => {
  const pathSegment = new PathSegment(":foo?");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["bar", "baz"];

  const result = matcher.match(uriSegments);
  assertEquals(result, {
    leftover: ["baz"],
    paramName: "foo",
    paramValue: "bar",
  });
});

Deno.test("SegmentMatcher: Optional param captured with no leftovers", () => {
  const pathSegment = new PathSegment(":foo?");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["bar"];

  const result = matcher.match(uriSegments);
  assertEquals(result, {
    leftover: [],
    paramName: "foo",
    paramValue: "bar",
  });
});

Deno.test("SegmentMatcher: Optional param absent", () => {
  const pathSegment = new PathSegment(":foo?");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments: string[] = [];

  const result = matcher.match(uriSegments);
  assertEquals(result, {
    leftover: [],
  });
});

Deno.test("SegmentMatcher: Single wildcard captures one segment", () => {
  const pathSegment = new PathSegment("*");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["wildcard", "next"];

  const result = matcher.match(uriSegments);
  assertEquals(result, {
    leftover: ["next"],
    wildcard: ["wildcard"],
  });
});

Deno.test("SegmentMatcher: Single wildcard with range matches", () => {
  const pathSegment = new PathSegment("[a-z]*");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["wildcard", "next"];

  const result = matcher.match(uriSegments);
  assertEquals(result, {
    leftover: ["next"],
    wildcard: ["wildcard"],
  });
});

Deno.test("SegmentMatcher: Single wildcard with range mismatch", () => {
  const pathSegment = new PathSegment("[a-z]*");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["wildcard123", "next"];

  const result = matcher.match(uriSegments);
  assertEquals(result, undefined);
});

Deno.test("SegmentMatcher: Multi wildcard captures all segments", () => {
  const pathSegment = new PathSegment("**");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["wildcard", "baz", "qux"];

  const result = matcher.match(uriSegments);
  assertEquals(result, {
    leftover: [],
    wildcard: ["wildcard", "baz", "qux"],
  });
});

Deno.test("SegmentMatcher: MultiString wildcard captures joined segments", () => {
  const pathSegment = new PathSegment("+");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["wildcard", "baz", "qux"];

  const result = matcher.match(uriSegments);
  assertEquals(result, {
    leftover: [],
    wildcard: ["wildcard/baz/qux"],
  });
});

Deno.test("SegmentMatcher: Optional wildcard present and captured", () => {
  const pathSegment = new PathSegment("?");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["wildcard", "next"];

  const result = matcher.match(uriSegments);
  assertEquals(result, {
    leftover: ["next"],
    wildcard: ["wildcard"],
  });
});

Deno.test("SegmentMatcher: Optional wildcard absent", () => {
  const pathSegment = new PathSegment("?");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments: string[] = [];

  const result = matcher.match(uriSegments);
  assertEquals(result, {
    leftover: [],
  });
});

Deno.test("SegmentMatcher: Parameter with range and multiString", () => {
  const pathSegment = new PathSegment(":foo[a-z]+");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["bar", "baz", "qux"];

  const result = matcher.match(uriSegments);
  assertEquals(result, {
    leftover: [],
    paramName: "foo",
    paramValue: "bar/baz/qux",
  });
});

Deno.test("SegmentMatcher: Wildcard with range and multi", () => {
  const pathSegment = new PathSegment("[a-z]**");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["alpha", "beta", "gamma"];

  const result = matcher.match(uriSegments);
  assertEquals(result, {
    leftover: [],
    wildcard: ["alpha", "beta", "gamma"],
  });
});

Deno.test("SegmentMatcher: Wildcard with range and multi mismatch", () => {
  const pathSegment = new PathSegment("[a-z]**");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["alpha", "beta123", "gamma"];

  const result = matcher.match(uriSegments);
  assertEquals(result, undefined);
});

Deno.test("SegmentMatcher: Empty URI segments", () => {
  const pathSegment = new PathSegment(":foo");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments: string[] = [];

  const result = matcher.match(uriSegments);
  assertEquals(result, undefined);
});

Deno.test("SegmentMatcher: Static segment with no URI segments", () => {
  const pathSegment = new PathSegment("hello");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments: string[] = [];

  const result = matcher.match(uriSegments);
  assertEquals(result, undefined);
});

Deno.test("SegmentMatcher: MultiString wildcard with no segments", () => {
  const pathSegment = new PathSegment("+");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments: string[] = [];

  const result = matcher.match(uriSegments);
  assertEquals(result, undefined);
});

Deno.test("SegmentMatcher: Optional param with range present", () => {
  const pathSegment = new PathSegment(":foo[a-z]?");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["bar", "next"];

  const result = matcher.match(uriSegments);
  assertEquals(result, {
    leftover: ["next"],
    paramName: "foo",
    paramValue: "bar",
  });
});

Deno.test("SegmentMatcher: Optional param with range absent", () => {
  const pathSegment = new PathSegment(":foo[a-z]?");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["123", "next"];

  const result = matcher.match(uriSegments);
  assertEquals(result, {
    leftover: ["123", "next"],
  });
});

Deno.test("SegmentMatcher: Wildcard with no range", () => {
  const pathSegment = new PathSegment("*");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["wildcard", "next"];

  const result = matcher.match(uriSegments);
  assertEquals(result, {
    leftover: ["next"],
    wildcard: ["wildcard"],
  });
});

Deno.test("SegmentMatcher: Param without range and no suffix", () => {
  const pathSegment = new PathSegment(":foo");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["bar"];

  const result = matcher.match(uriSegments);
  assertEquals(result, {
    leftover: [],
    paramName: "foo",
    paramValue: "bar",
  });
});

Deno.test("SegmentMatcher: Param without range and multiple segments with single modifier", () => {
  const pathSegment = new PathSegment(":foo");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["bar", "baz"];

  const result = matcher.match(uriSegments);
  assertEquals(result, {
    leftover: ["baz"],
    paramName: "foo",
    paramValue: "bar",
  });
});

Deno.test("SegmentMatcher: Multi wildcard with range", () => {
  const pathSegment = new PathSegment("[0-9]**");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["123", "456", "789"];

  const result = matcher.match(uriSegments);
  assertEquals(result, {
    leftover: [],
    wildcard: ["123", "456", "789"],
  });
});

Deno.test("SegmentMatcher: Multi wildcard with range mismatch", () => {
  const pathSegment = new PathSegment("[0-9]**");
  const matcher = new SegmentMatcher(pathSegment);
  const uriSegments = ["123", "abc", "789"];

  const result = matcher.match(uriSegments);
  assertEquals(result, undefined);
});