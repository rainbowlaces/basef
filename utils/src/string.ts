/**
 * String manipulation utilities.
 *
 * This module provides functions for converting between string cases (e.g.,
 * kebab-case, camelCase, etc.), validating string formats, and performing
 * common transformations like truncating or slugifying.
 *
 * ## Example Usage
 *
 * ```typescript
 * import {
 *   kebabToUpperCamel,
 *   camelToKebab,
 *   isKebabCase,
 *   stringToSlug,
 *   truncate,
 * } from "./string.ts";
 *
 * // Convert kebab-case to UpperCamelCase
 * const result = kebabToUpperCamel("hello-world");
 * console.log(result); // "HelloWorld"
 *
 * // Convert camelCase to kebab-case
 * const kebab = camelToKebab("helloWorld");
 * console.log(kebab); // "hello-world"
 *
 * // Validate kebab-case
 * console.log(isKebabCase("hello-world")); // true
 *
 * // Generate a slug
 * const slug = stringToSlug("Hello, World!");
 * console.log(slug); // "hello-world"
 *
 * // Truncate a string
 * const short = truncate("This is a long string", 10);
 * console.log(short); // "This is a [TRUNCATED]"
 * ```
 *
 * ### Available Functions
 * - `kebabToUpperCamel(str: string): string`
 * - `kebabToLowerCamel(str: string): string`
 * - `camelToKebab(str: string): string`
 * - `camelToLowerUnderscore(str: string): string`
 * - `camelToUpperUnderscore(str: string): string`
 * - `isUpperCamelCase(str: string): boolean`
 * - `isLowerCamelCase(str: string): boolean`
 * - `isLowerUnderscore(str: string): boolean`
 * - `isUpperUnderscore(str: string): boolean`
 * - `isKebabCase(str: string): boolean`
 * - `stringToSlug(contentName: string): string`
 * - `truncate(str: string, length: number, appendToEnd?: string): string`
 *
 * ### Notes
 * - Ensure input strings are sanitized before transformations where necessary.
 */

export function kebabToUpperCamel(str: string): string {
  return str
    .split(/[-_\s]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

export function kebabToLowerCamel(str: string): string {
  const word = kebabToUpperCamel(str);
  return word.charAt(0).toLowerCase() + word.slice(1);
}

export function camelToKebab(str: string): string {
  return str
    .replace(/^([A-Z])/, (_match, p1) => p1.toLowerCase())
    .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2")
    .toLowerCase();
}

export function camelToLowerUnderscore(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
}

export function camelToUpperUnderscore(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
}

export function isUpperCamelCase(str: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(str);
}

export function isLowerCamelCase(str: string): boolean {
  return /^[a-z][a-zA-Z0-9]*$/.test(str);
}

export function isLowerUnderscore(str: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(str);
}

export function isUpperUnderscore(str: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(str);
}

export function isKebabCase(str: string): boolean {
  return /^[a-z][a-z0-9-]*$/.test(str);
}

export function stringToSlug(contentName: string): string {
  const sanitized = contentName.replace(/[^a-z0-9\s]/gi, "");
  const collapsedSpaces = sanitized.replace(/\s+/g, " ");
  const slug = collapsedSpaces.trim().toLowerCase().replace(/\s/g, "-");
  return slug;
}

export function truncate(
  str: string,
  length: number,
  appendToEnd: string = "[TRUNCATED]",
): string {
  if (!str) return "";
  if (str.length > length) {
    if (appendToEnd.length > length) {
      return str.substring(0, length);
    } else {
      return `${str.substring(0, length - appendToEnd.length)}${appendToEnd}`;
    }
  }
  return str;
}