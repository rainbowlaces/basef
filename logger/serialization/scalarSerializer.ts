import type { Scalar, TypeSerializer, TypeSerializerConfig } from "../types.ts";

export class ScalarSerializer implements TypeSerializer<Scalar> {
  private maxLength: number = 1024;

  constructor(config: TypeSerializerConfig) {
    this.maxLength = (config.maxLength as number) ?? this.maxLength;
  }

  canSerialize(input: unknown): input is Scalar {
    return (
      ["string", "number", "boolean", "undefined"].includes(typeof input) ||
      input === null
    );
  }

  serialize(input: Scalar): Scalar {
    if (typeof input === "string" && input.length > this.maxLength) {
      return `${input.substring(0, this.maxLength - 11)}[TRUNCATED]`;
    }
    return input;
  }
}
