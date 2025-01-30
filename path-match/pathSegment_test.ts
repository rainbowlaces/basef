// pathSegment_test.ts

import { assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";
import { PathSegment } from "./pathSegment.ts";

// A collection of tests to confirm PathSegment correctly parses
// static segments, named params, bracket ranges, and wildcard modifiers.

Deno.test("Static segment: basic", () => {
  const seg = new PathSegment("hello");
  assertEquals(seg.getType(), "static");
  assertEquals(seg.isParam(), false);
  assertEquals(seg.isWildcard(), false);
  assertEquals(seg.getName(), undefined);
  assertEquals(seg.getRange(), undefined);
});

Deno.test("Named param: no suffix => single by default", () => {
  const seg = new PathSegment(":foo");
  assertEquals(seg.isParam(), true);
  assertEquals(seg.getName(), "foo");
  // Since :foo is effectively :foo*, we expect it to be single
  assertEquals(seg.isSingle(), true);
  assertEquals(seg.getType(), "single");
});

Deno.test("Named param: optional suffix (?:)", () => {
  const seg = new PathSegment(":bar?");
  assertEquals(seg.isParam(), true);
  assertEquals(seg.getName(), "bar");
  assertEquals(seg.isOptional(), true);
  assertEquals(seg.getType(), "optional");
});

Deno.test("Named param: + suffix (multi-string)", () => {
  const seg = new PathSegment(":baz+");
  assertEquals(seg.isParam(), true);
  assertEquals(seg.getName(), "baz");
  assertEquals(seg.isMultiString(), true);
  assertEquals(seg.getType(), "multi-string");
});

Deno.test("Named param: single-star suffix (:foo*)", () => {
  const seg = new PathSegment(":foo*");
  assertEquals(seg.isParam(), true);
  assertEquals(seg.getName(), "foo");
  assertEquals(seg.isSingle(), true);
  assertEquals(seg.getType(), "single");
});

Deno.test("Named param: double-star suffix (:foo**)", () => {
  const seg = new PathSegment(":stuff**");
  assertEquals(seg.isParam(), true);
  assertEquals(seg.getName(), "stuff");
  assertEquals(seg.isMulti(), true);
  assertEquals(seg.getType(), "multi");
});

Deno.test("Named param with bracket range", () => {
  const seg = new PathSegment(":id[a-z0-9]+");
  assertEquals(seg.isParam(), true);
  assertEquals(seg.getName(), "id");
  assertEquals(seg.getRange(), "[a-z0-9]");
  assertEquals(seg.isMultiString(), true);
  assertEquals(seg.getType(), "multi-string");
});

Deno.test("Standalone wildcard: *", () => {
  const seg = new PathSegment("*");
  assertEquals(seg.isWildcard(), true);
  assertEquals(seg.isSingle(), true);
  assertEquals(seg.getType(), "single");
});

Deno.test("Standalone wildcard: **", () => {
  const seg = new PathSegment("**");
  assertEquals(seg.isWildcard(), true);
  assertEquals(seg.isMulti(), true);
  assertEquals(seg.getType(), "multi");
});

Deno.test("Standalone wildcard: ?", () => {
  const seg = new PathSegment("?");
  assertEquals(seg.isWildcard(), true);
  assertEquals(seg.isOptional(), true);
  assertEquals(seg.getType(), "optional");
});

Deno.test("Standalone wildcard: +", () => {
  const seg = new PathSegment("+");
  assertEquals(seg.isWildcard(), true);
  assertEquals(seg.isMultiString(), true);
  assertEquals(seg.getType(), "multi-string");
});

Deno.test("Bracketed range wildcard: [a-z]", () => {
  const seg = new PathSegment("[a-z]");
  assertEquals(seg.isWildcard(), true);
  assertEquals(seg.getRange(), "[a-z]");
  assertEquals(seg.getType(), "single");
});

Deno.test("Bracketed range wildcard with suffix: [a-z]*", () => {
  const seg = new PathSegment("[a-z]*");
  assertEquals(seg.isWildcard(), true);
  assertEquals(seg.getRange(), "[a-z]");
  assertEquals(seg.isSingle(), true);
  assertEquals(seg.getType(), "single");
});

Deno.test("Bracketed range wildcard: [a-z]+ -> multi-string", () => {
  const seg = new PathSegment("[a-z]+");
  assertEquals(seg.isWildcard(), true);
  assertEquals(seg.getRange(), "[a-z]");
  assertEquals(seg.isMultiString(), true);
  assertEquals(seg.getType(), "multi-string");
});

Deno.test("Bracketed range wildcard: [a-z]** -> multi", () => {
  const seg = new PathSegment("[a-z]**");
  assertEquals(seg.isWildcard(), true);
  assertEquals(seg.getRange(), "[a-z]");
  assertEquals(seg.isMulti(), true);
  assertEquals(seg.getType(), "multi");
});

Deno.test("Empty segment throws", () => {
  assertThrows(() => {
    // e.g. user typed an empty string
    new PathSegment("");
  }, Error, "Empty segment is not allowed.");
});

Deno.test("Invalid param name throws", () => {
  assertThrows(() => {
    // after removing : we’re left with “[a-z]*” as the name portion
    new PathSegment(":[a-z]*");
  });
});