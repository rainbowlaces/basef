// pathSegment.ts

export interface PathSegmentData {
  segmentType: "static" | "param" | "wildcard";
  name?: string;
  range?: string;
  optional: boolean;
  single: boolean;
  multi: boolean;
  multiString: boolean;
}

/**
 * PathSegment is responsible for parsing a single raw path segment into a structured form.
 * It exposes methods to access its properties for testing and matching.
 */
export class PathSegment {
  private data: PathSegmentData = {
    segmentType: "static",
    optional: false,
    single: false,
    multi: false,
    multiString: false,
  };

  constructor(private rawSegment: string) {
    this.parse(rawSegment);
  }

  private parse(seg: string): void {
    seg = seg.trim();
    if (!seg) {
      throw new Error("Empty segment is not allowed.");
    }

    // Named param?
    if (seg.startsWith(":")) {
      this.data.segmentType = "param";
      this.parseParam(seg.slice(1));
      return;
    }

    // Wildcard followed by bracketed range (e.g., "*[a-z]")
    const wildcardWithRangeMatch = seg.match(/^(\*\*|\*|\+|\?)(\[[^\]]+\])(.*)$/);
    if (wildcardWithRangeMatch) {
      this.data.segmentType = "wildcard";
      const [, wildcardSymbol, rangePart, suffix] = wildcardWithRangeMatch;
      this.data.range = rangePart;

      // Set flags based on wildcard symbol
      switch (wildcardSymbol) {
        case "*":
          this.data.single = true;
          break;
        case "**":
          this.data.multi = true;
          break;
        case "+":
          this.data.multiString = true;
          break;
        case "?":
          this.data.optional = true;
          break;
        default:
          throw new Error(`Unknown wildcard symbol: "${wildcardSymbol}"`);
      }

      // Handle suffix after range
      this.applySuffix(suffix);
      return;
    }

    // Standalone wildcard?
    if (this.isStandaloneWildcard(seg)) {
      this.data.segmentType = "wildcard";
      this.parseStandaloneWildcard(seg);
      return;
    }

    // Bracketed range wildcard? (e.g., "[a-z]*")
    const bracketedRangeMatch = seg.match(/^(\[[^\]]+\])(.*)$/);
    if (bracketedRangeMatch) {
      this.data.segmentType = "wildcard";
      const [, bracketPart, suffix] = bracketedRangeMatch;
      this.data.range = bracketPart;

      // Handle suffix after range
      this.applySuffix(suffix);
      return;
    }

    // Otherwise, static
    this.data.segmentType = "static";
  }

  private parseParam(core: string): void {
    const bracketStart = core.indexOf("[");
    if (bracketStart !== -1) {
      // e.g., foo[a-z]+
      const namePart = core.slice(0, bracketStart);
      if (!namePart) {
        throw new Error(`Invalid param syntax. Missing name before bracket: ":${core}"`);
      }
      this.data.name = namePart;

      // Extract bracketed range
      const bracketEnd = core.indexOf("]", bracketStart);
      if (bracketEnd === -1) {
        throw new Error(`Invalid bracket expression in param: ":${core}"`);
      }
      const rangePart = core.slice(bracketStart, bracketEnd + 1); // "[a-z]"
      this.data.range = rangePart;

      // Extract suffix after the bracket
      const suffix = core.slice(bracketEnd + 1); // e.g., "+"

      this.applySuffix(suffix);
      return;
    }

    // No bracket, handle suffixes
    let suffix = '';
    let name = core;
    if (core.endsWith("**")) {
      suffix = "**";
      name = core.slice(0, -2);
    } else if (core.endsWith("+")) {
      suffix = "+";
      name = core.slice(0, -1);
    } else if (core.endsWith("?")) {
      suffix = "?";
      name = core.slice(0, -1);
    } else if (core.endsWith("*")) {
      suffix = "*";
      name = core.slice(0, -1);
    }

    this.applySuffix(suffix);
    this.data.name = name;

    if (!this.data.name) {
      throw new Error(`Invalid param syntax: ":${core}"`);
    }
  }

  private parseStandaloneWildcard(seg: string): void {
    switch (seg) {
      case "*":
        this.data.single = true;
        break;
      case "**":
        this.data.multi = true;
        break;
      case "?":
        this.data.optional = true;
        break;
      case "+":
        this.data.multiString = true;
        break;
      default:
        throw new Error(`Unknown standalone wildcard: "${seg}"`);
    }
  }

  private parseBracketedRange(seg: string): void {
    const closingIndex = seg.indexOf("]");
    if (closingIndex === -1) {
      throw new Error(`Invalid bracket expression: "${seg}"`);
    }

    const bracketPart = seg.slice(0, closingIndex + 1); // e.g., "[a-z]"
    this.data.range = bracketPart;

    const suffix = seg.slice(closingIndex + 1); // e.g., "+"

    this.applySuffix(suffix);
  }

  private applySuffix(suffix: string): void {
    switch (suffix) {
      case "+":
        this.data.multiString = true;
        break;
      case "?":
        this.data.optional = true;
        break;
      case "*":
        this.data.single = true;
        break;
      case "**":
        this.data.multi = true;
        break;
      case "":
        // No suffix, default behavior
        if (this.data.segmentType === "param" || this.data.segmentType === "wildcard") {
          this.data.single = true; // Set single for wildcards without suffix
        }
        break;
      default:
        throw new Error(`Unknown suffix: "${suffix}"`);
    }

    // If no flags are set and it's a param or wildcard, default to single
    if (
      (this.data.segmentType === "param" || this.data.segmentType === "wildcard") &&
      !this.data.optional &&
      !this.data.multi &&
      !this.data.multiString &&
      !this.data.single
    ) {
      this.data.single = true;
    }
  }

  private isStandaloneWildcard(s: string): boolean {
    return s === "*" || s === "**" || s === "?" || s === "+";
  }

  private looksLikeRange(s: string): boolean {
    return s.startsWith("[") && s.includes("]");
  }

  // ───────────────────────────────────────────────────────────
  // Accessor Methods
  // ───────────────────────────────────────────────────────────

  /** The underlying data, if you need direct access. */
  public getData(): PathSegmentData {
    return this.data;
  }

  /** The original raw segment text. */
  public getRaw(): string {
    return this.rawSegment;
  }

  public isParam(): boolean {
    return this.data.segmentType === "param";
  }

  public isWildcard(): boolean {
    return this.data.segmentType === "wildcard";
  }

  public isOptional(): boolean {
    return this.data.optional;
  }

  public isSingle(): boolean {
    return this.data.single;
  }

  public isMulti(): boolean {
    return this.data.multi;
  }

  public isMultiString(): boolean {
    return this.data.multiString;
  }

  /** If named param or static, returns the `name`; otherwise undefined. */
  public getName(): string | undefined {
    return this.data.name;
  }

  /** If bracket range is defined, returns it; otherwise undefined. */
  public getRange(): string | undefined {
    return this.data.range;
  }

  /**
   * Return a string describing the "effective" type,
   * matching the test's expectations:
   * - "static" | "optional" | "single" | "multi" | "multi-string"
   */
  public getType():
    | "static"
    | "optional"
    | "single"
    | "multi"
    | "multi-string" {
    if (this.data.segmentType === "static") {
      return "static";
    }
    if (this.data.optional) {
      return "optional";
    }
    if (this.data.multiString) {
      return "multi-string";
    }
    if (this.data.multi) {
      return "multi";
    }
    if (this.data.single) {
      return "single";
    }
    // fallback
    return "static";
  }
}