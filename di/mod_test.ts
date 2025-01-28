import {
  assertEquals,
  assertInstanceOf,
  assertThrows,
} from "jsr:@std/assert@1.0.0";
import { BaseDi } from "./mod.ts";

Deno.test("BaseDi.create() returns a new instance of BaseDi", () => {
  const di = BaseDi.create();
  assertInstanceOf(di, BaseDi);
});

Deno.test("BaseDi - Registers and retrieves a singleton instance", () => {
  class MyClass {}
  const instance = new MyClass();

  BaseDi.register(instance);
  const resolved = BaseDi.create().resolve(MyClass);

  assertEquals(resolved, instance);
});

Deno.test("BaseDi - Registers and retrieves a constructor (new instance each time)", () => {
  class MyClass {}

  BaseDi.register(MyClass);
  const di = BaseDi.create();

  const instance1 = di.resolve(MyClass);
  const instance2 = di.resolve(MyClass);

  assertInstanceOf(instance1, MyClass);
  assertInstanceOf(instance2, MyClass);
  assertEquals(instance1 !== instance2, true);
});

Deno.test("BaseDi - Registers and retrieves a scalar value", () => {
  BaseDi.register(42, "myNumber");

  const di = BaseDi.create();
  assertEquals(di.resolve("myNumber"), 42);
});

Deno.test("BaseDi - Registers and retrieves an instance with a custom key", () => {
  class MyClass {}
  const instance = new MyClass();

  BaseDi.register(instance, "customKey");
  const di = BaseDi.create();

  assertEquals(di.resolve("customKey"), instance);
});

Deno.test("BaseDi - Throws error when registering a scalar without a key", () => {
  assertThrows(
    () => BaseDi.register(42),
    Error,
    "Key is required for scalar values",
  );
});

Deno.test("BaseDi - Resolves a singleton instance correctly", () => {
  class MyClass {}
  const instance = new MyClass();

  BaseDi.register(instance);
  const di = BaseDi.create();

  assertEquals(di.resolve(MyClass), instance);
});

Deno.test("BaseDi - Resolves a constructor and returns a new instance each time", () => {
  class MyClass {}

  BaseDi.register(MyClass);
  const di = BaseDi.create();

  const instance1 = di.resolve(MyClass);
  const instance2 = di.resolve(MyClass);

  assertInstanceOf(instance1, MyClass);
  assertInstanceOf(instance2, MyClass);
  assertEquals(instance1 !== instance2, true);
});

Deno.test("BaseDi - Resolves a scalar value correctly", () => {
  BaseDi.register("Hello World", "greeting");

  const di = BaseDi.create();
  assertEquals(di.resolve("greeting"), "Hello World");
});

Deno.test("BaseDi - Resolves a non-existent key as null", () => {
  const di = BaseDi.create();
  assertEquals(di.resolve("nonexistent"), null);
});