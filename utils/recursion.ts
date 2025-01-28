/**
 * Utility for recursively merging objects.
 *
 * This module provides a single function, `merge`, to deeply merge two objects.
 * It is particularly useful when combining configuration objects, settings,
 * or other structured data where nested values need to be merged rather
 * than replaced entirely.
 *
 * ## Example Usage
 *
 * ```typescript
 * import { merge } from "./recursion.ts";
 *
 * const baseConfig = {
 *   server: {
 *     port: 8080,
 *     logging: { level: "info" },
 *   },
 *   features: ["featureA"],
 * };
 *
 * const userConfig = {
 *   server: {
 *     logging: { level: "debug", timestamp: true },
 *   },
 *   features: ["featureB"],
 * };
 *
 * const finalConfig = merge(baseConfig, userConfig);
 * console.log(finalConfig);
 * // Output:
 * // {
 * //   server: {
 * //     port: 8080,
 * //     logging: { level: "debug", timestamp: true },
 * //   },
 * //   features: ["featureB"],
 * // }
 * ```
 *
 * ### Notes
 * - Arrays in `apply` replace arrays in `base` entirely.
 * - Only objects are merged recursively; other types are overwritten.
 */

/**
 * Recursively merges two objects, where properties from the `apply` object
 * override those in the `base` object. For properties existing as objects
 * in both `base` and `apply`, their contents are merged recursively.
 *
 * @param {Record<string, any>} base - The base object to merge into.
 * @param {Record<string, any>} apply - The object whose properties will override or extend the base object.
 * @returns {Record<string, any>} - The result of merging `apply` into `base`.
 */
export function merge(
  // deno-lint-ignore no-explicit-any
  base: Record<string, any>,
  // deno-lint-ignore no-explicit-any
  apply: Record<string, any>,
// deno-lint-ignore no-explicit-any
): Record<string, any> {
  // Helper function to merge two objects
  // deno-lint-ignore no-explicit-any
  const mergeObjects = (target: any, source: any): any => {
    Object.keys(source).forEach((key) => {
      const sourceValue = source[key];
      const targetValue = target[key];

      // If both values are objects (and not arrays), merge them recursively
      if (
        typeof sourceValue === "object" &&
        sourceValue !== null &&
        typeof targetValue === "object" &&
        targetValue !== null &&
        !(sourceValue instanceof Array) &&
        !(targetValue instanceof Array)
      ) {
        target[key] = mergeObjects({ ...targetValue }, sourceValue);
      } else {
        // Overwrite the target with the source value for arrays, primitives, or if the target is not an object
        target[key] = sourceValue;
      }
    });
    return target;
  };

  // Initiate the merge process
  return mergeObjects({ ...base }, apply);
}

type RecursiveMapOptions = {
  maxDepth?: number;
  maxItems?: number;
};

export type TransformFunction = (value: unknown) => unknown;
export type GetTransformerFunction = (
  value: unknown,
) => TransformFunction | null;

export function recursiveMap(
  input: unknown,
  options: RecursiveMapOptions = {},
  getTransformer: GetTransformerFunction = () => null,
  currentDepth: number = 1,
  seen: WeakMap<object, unknown> = new WeakMap(),
): unknown {
  const { maxDepth = 10, maxItems = Infinity } = options;
  if (currentDepth > maxDepth) {
    return {};
  }

  const transformer = getTransformer(input);
  if (transformer !== null) {
    return transformer(input);
  }

  if (typeof input === "object" && input !== null) {
    if (seen.has(input)) {
      return seen.get(input);
    }

    const isInputArray = Array.isArray(input);
    const entries = isInputArray
      ? input.map((item, index) => ({ key: index, value: item }))
      : Object.entries(input).map(([key, value]) => ({ key, value }));
    const limitedEntries = entries.slice(0, maxItems);

    const copy: unknown[] | Record<string, unknown> = isInputArray ? [] : {};
    seen.set(input, copy);

    limitedEntries.forEach(({ key, value }) => {
      const transformedValue = recursiveMap(
        value,
        options,
        getTransformer,
        currentDepth + 1,
        seen,
      );
      if (isInputArray) {
        (copy as unknown[])[key as number] = transformedValue;
      } else {
        (copy as Record<string, unknown>)[key] = transformedValue;
      }
    });

    return copy;
  } else {
    return input;
  }
}