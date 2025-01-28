import type { TypeSerializer } from "../types.ts";

// deno-lint-ignore no-explicit-any
type Constructor = new (...args: any[]) => any;

export class ConstructorSerializer implements TypeSerializer<Constructor> {
  // deno-lint-ignore no-explicit-any
  canSerialize(input: any): input is Constructor {
    return typeof input === "function";
  }

  serialize(input: Constructor): string {
    return input.name;
  }
}
