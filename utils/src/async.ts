/**
 * Utilities for asynchronous programming and promise management.
 *
 * This module provides functions to manage tasks that require delays,
 * microtask scheduling, or async iteration. Useful for controlling execution
 * order in async workflows and manipulating asynchronous data sources.
 *
 * ## Example Usage
 *
 * ```typescript
 * import { microtask, tick, delay, asyncMap, asyncFilter } from "./async.ts";
 *
 * // Microtask example
 * await microtask();
 * console.log("This runs after microtasks");
 *
 * // Delay example
 * await delay(1000);
 * console.log("This runs after 1 second");
 *
 * // Async map example
 * const numbers = [1, 2, 3];
 * const squares = await asyncMap(numbers, async (x) => x * x);
 * console.log(squares); // [1, 4, 9]
 *
 * // Async filter example
 * const evens = await asyncFilter(numbers, async (x) => x % 2 === 0);
 * console.log(evens); // [2]
 * ```
 */

import { setTimeout, setImmediate } from "node:timers";

export async function microtask(): Promise<void> {
  return Promise.resolve();
}

export async function tick(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

export async function delay(timeout: number = 0): Promise<void> {
  if (!timeout) return tick();
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

export async function asyncMap<T, R = void>(
  iterable:
    | Iterable<T>
    | AsyncIterable<T>
    | Promise<Iterable<T> | AsyncIterable<T>>,
  fn: (item: T) => Promise<R | undefined>,
): Promise<R[]> {
  iterable = await iterable;

  if (Symbol.asyncIterator in Object(iterable)) {
    const asyncIterable = iterable as AsyncIterable<T>;
    const results: R[] = [];
    for await (const item of asyncIterable) {
      const i = await fn(item);
      if (i !== undefined) results.push(i);
    }
    return results;
  } else {
    const res = await Promise.all(Array.from(iterable as Iterable<T>).map(fn));
    return res.filter((r) => r !== undefined) as R[];
  }
}

type AsyncPredicate<T> = (item: T) => Promise<boolean>;

export async function asyncFilter<T>(
  iterable:
    | Iterable<T>
    | AsyncIterable<T>
    | Promise<Iterable<T> | AsyncIterable<T>>,
  predicate: AsyncPredicate<T> = async (v) => !!v,
): Promise<T[]> {
  iterable = await iterable;

  const results: T[] = [];

  if (Symbol.asyncIterator in Object(iterable)) {
    const asyncIterable = iterable as AsyncIterable<T>;
    for await (const item of asyncIterable) {
      if (await predicate(item)) {
        results.push(item);
      }
    }
  } else {
    for (const item of iterable as Iterable<T>) {
      if (await predicate(item)) {
        results.push(item);
      }
    }
  }

  return results;
}
