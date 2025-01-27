# Base Utils

Base Utils is a TypeScript utility library for Deno, providing essential tools for:
* Asynchronous programming: Manage delays, process iterables asynchronously, and schedule tasks.
 * Object manipulation: Deeply merge objects with ease.
 * String manipulation: Convert between string case formats, validate patterns, and transform strings.

## Installation

To use Base Utils in your Deno project, install it via JSR:

```typescript
import { delay, asyncMap, merge, camelToKebab } from "jsr:@basef/utils";
```

## Modules

### Async Utilities
Provides tools for managing asynchronous workflows and tasks.
```typescript
microtask(): Promise<void>  
// Schedules a task to run in the microtask queue.

tick(): Promise<void>
// Schedules a task to run on the next event loop tick.

delay(timeout: number): Promise<void>
// Delays execution by the specified timeout (in milliseconds).
asyncMap<T, R>(iterable, fn): Promise<R[]>
// Applies an asynchronous function to each element in an iterable or async iterable.
asyncFilter<T>(iterable, predicate): Promise<T[]>
// Filters elements in an iterable or async iterable based on an asynchronous predicate.
```

## Recursion Utilities

Contains tools for deep object manipulation.
```typescript
merge(base: Record<string, any>, apply: Record<string, any>): Record<string, any>
// Recursively merges two objects. Nested objects are merged, while arrays and primitive values are overwritten.
```
Notes:
* Arrays in apply completely replace arrays in base.
* Merges are shallow for non-object types.
## String Utilities
Offers functions for case conversions, pattern validation, and transformations.
Key Functions:
```typescript
// Case Conversions
kebabToUpperCamel(str: string): string
camelToKebab(str: string): string
camelToLowerUnderscore(str: string): string

// Validation
isKebabCase(str: string): boolean
isUpperCamelCase(str: string): boolean

//Converts a string into a URL-friendly slug.
stringToSlug(contentName: string): string

// Truncates a string to the specified length with an optional suffix.
truncate(str: string, length: number, appendToEnd?: string): string
```

## Usage Examples

### Async Utilities
```typescript
import { delay, asyncMap, asyncFilter } from "jsr:@basef/utils";

await delay(1000);
console.log("This runs after 1 second.");

const numbers = [1, 2, 3];
const squares = await asyncMap(numbers, async (x) => x * x);
console.log(squares); // [1, 4, 9]

const evens = await asyncFilter(numbers, async (x) => x % 2 === 0);
console.log(evens); // [2]
```

### Recursion Utilities
```typescript
import { merge } from "jsr:@basef/utils";

const base = { a: 1, b: { c: 2 } };
const apply = { b: { d: 3 } };

const result = merge(base, apply);
console.log(result);
// { a: 1, b: { c: 2, d: 3 } }
```

### String Utilities

```typescript
import {
  kebabToUpperCamel,
  camelToKebab,
  stringToSlug,
  truncate,
} from "jsr:@basef/utils";

// Convert kebab-case to UpperCamelCase
console.log(kebabToUpperCamel("hello-world")); // "HelloWorld"

// Convert camelCase to kebab-case
console.log(camelToKebab("helloWorld")); // "hello-world"

// Generate a slug
console.log(stringToSlug("Hello, World!")); // "hello-world"

// Truncate a string
console.log(truncate("This is a long string", 10)); // "This is a [TRUNCATED]"
```

## License
This project is licensed under the MIT License. See the LICENSE file for details.