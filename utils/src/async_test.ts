import { assertEquals } from "@std/assert";
import { microtask, tick, delay, asyncMap, asyncFilter } from "./async.ts";

Deno.test("microtask resolves on the next microtask queue", async () => {
  let resolved = false;
  const promise = microtask().then(() => (resolved = true));
  assertEquals(resolved, false); // Should not resolve immediately
  await promise;
  assertEquals(resolved, true); // Should resolve in the same tick
});

Deno.test("tick resolves on the next event loop tick", async () => {
  let resolved = false;
  const promise = tick().then(() => (resolved = true));
  assertEquals(resolved, false); // Should not resolve immediately
  await promise;
  assertEquals(resolved, true); // Should resolve after a tick
});

Deno.test("delay resolves after the specified timeout", async () => {
  const start = performance.now();
  await delay(100); // Delay for 100ms
  const elapsed = performance.now() - start;
  assertEquals(elapsed >= 100, true); // Allow slight timing inaccuracies
});

Deno.test("asyncMap maps over synchronous iterable", async () => {
  const input = [1, 2, 3];
  const result = await asyncMap(input, async (x) => x * 2);
  assertEquals(result, [2, 4, 6]);
});

Deno.test("asyncMap maps over asynchronous iterable", async () => {
  async function* asyncGenerator() {
    yield 1;
    yield 2;
    yield 3;
  }
  const result = await asyncMap(asyncGenerator(), async (x) => x * 2);
  assertEquals(result, [2, 4, 6]);
});

Deno.test("asyncFilter filters synchronous iterable", async () => {
  const input = [1, 2, 3, 4];
  const result = await asyncFilter(input, async (x) => x % 2 === 0);
  assertEquals(result, [2, 4]);
});

Deno.test("asyncFilter filters asynchronous iterable", async () => {
  async function* asyncGenerator() {
    yield 1;
    yield 2;
    yield 3;
    yield 4;
  }
  const result = await asyncFilter(asyncGenerator(), async (x) => x % 2 === 0);
  assertEquals(result, [2, 4]);
});