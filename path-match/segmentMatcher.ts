import type { PathSegment } from "./pathSegment.ts";

export interface SegmentMatchResult {
  leftover: string[];
  paramName?: string;
  paramValue?: string | string[];
  wildcard?: string[];
}

export class SegmentMatcher {
  public readonly segType: "static" | "param" | "wildcard";
  public readonly name?: string;
  public readonly range?: string;
  public readonly optional: boolean;
  public readonly single: boolean;
  public readonly multi: boolean;
  public readonly multiString: boolean;

  constructor(private segment: PathSegment) {
    const data = segment.getData();
    this.segType = data.segmentType;
    this.name = data.name;
    this.range = data.range;
    this.optional = data.optional;
    this.single = data.single;
    this.multi = data.multi;
    this.multiString = data.multiString;
  }

  /**
   * Attempts to match the current segment against the provided URI segments.
   * Returns a SegmentMatchResult if successful, otherwise undefined.
   */
  public match(uriSegments: string[]): SegmentMatchResult | undefined {
    switch (this.segType) {
      case "static":
        return this.matchStatic(uriSegments);
      case "param":
        return this.matchParam(uriSegments);
      case "wildcard":
        return this.matchWildcard(uriSegments);
      default:
        return undefined;
    }
  }

  // ───────────────────────────── STATIC ──────────────────────────────────
  /**
   * Matches static segments by exact string comparison.
   */
  private matchStatic(segments: string[]): SegmentMatchResult | undefined {
    if (segments.length === 0) return undefined;
    const [first, ...rest] = segments;
    // Compare with the raw segment string
    if (first === this.segment.getRaw()) {
      return { leftover: rest };
    }
    return undefined;
  }

  // ───────────────────────────── PARAM ───────────────────────────────────
  /**
   * Matches parameter segments based on their type and modifiers.
   */
  private matchParam(segments: string[]): SegmentMatchResult | undefined {
    if (!this.name) return undefined;

    if (this.single) {
      return this.matchSingleParam(segments);
    }
    if (this.multi) {
      return this.matchMultiParam(segments);
    }
    if (this.multiString) {
      return this.matchMultiStringParam(segments);
    }
    if (this.optional) {
      return this.matchOptionalParam(segments);
    }
    return undefined;
  }

  /**
   * Matches single parameter segments (e.g., :foo).
   */
  private matchSingleParam(segments: string[]): SegmentMatchResult | undefined {
    if (segments.length === 0) return undefined;
    const [first, ...rest] = segments;
    if (this.range && !this.inBracketRange(first, this.range)) {
      return undefined;
    }
    return {
      leftover: rest,
      paramName: this.name,
      paramValue: first,
    };
  }

  /**
   * Matches multi parameter segments (e.g., :foo**).
   * Captures all remaining segments as an array.
   */
  private matchMultiParam(segments: string[]): SegmentMatchResult | undefined {
    if (segments.length === 0) return undefined;
    for (const seg of segments) {
      if (this.range && !this.inBracketRange(seg, this.range)) {
        return undefined;
      }
    }
    return {
      leftover: [],
      paramName: this.name,
      paramValue: segments,
    };
  }

  /**
   * Matches multi-string parameter segments (e.g., :foo+).
   * Captures all remaining segments joined by "/".
   */
  private matchMultiStringParam(segments: string[]): SegmentMatchResult | undefined {
    if (segments.length === 0) return undefined;
    for (const seg of segments) {
      if (this.range && !this.inBracketRange(seg, this.range)) {
        return undefined;
      }
    }
    return {
      leftover: [],
      paramName: this.name,
      paramValue: segments.join("/"),
    };
  }

  /**
   * Matches optional parameter segments (e.g., :foo?).
   * Captures one segment if present and valid, otherwise skips.
   */
  private matchOptionalParam(segments: string[]): SegmentMatchResult | undefined {
    if (segments.length === 0) {
      return { leftover: [] };
    }
    const [first, ...rest] = segments;
    if (this.range && !this.inBracketRange(first, this.range)) {
      // Skip capturing
      return { leftover: segments };
    }
    return {
      leftover: rest,
      paramName: this.name,
      paramValue: first,
    };
  }

  // ───────────────────────────── WILDCARD ────────────────────────────────
  /**
   * Matches wildcard segments based on their type and modifiers.
   */
  private matchWildcard(segments: string[]): SegmentMatchResult | undefined {
    if (this.single) {
      return this.matchSingleWildcard(segments);
    }
    if (this.multi) {
      return this.matchMultiWildcard(segments);
    }
    if (this.multiString) {
      return this.matchMultiStringWildcard(segments);
    }
    if (this.optional) {
      return this.matchOptionalWildcard(segments);
    }
    return undefined;
  }

  /**
   * Matches single wildcard segments (e.g., *).
   */
  private matchSingleWildcard(segments: string[]): SegmentMatchResult | undefined {
    if (segments.length === 0) return undefined;
    const [first, ...rest] = segments;
    if (this.range && !this.inBracketRange(first, this.range)) {
      return undefined;
    }
    return { leftover: rest, wildcard: [first] };
  }

  /**
   * Matches multi wildcard segments (e.g., **).
   * Captures all remaining segments as an array.
   */
  private matchMultiWildcard(segments: string[]): SegmentMatchResult | undefined {
    if (segments.length === 0) return undefined;
    for (const s of segments) {
      if (this.range && !this.inBracketRange(s, this.range)) {
        return undefined;
      }
    }
    return { leftover: [], wildcard: segments };
  }

  /**
   * Matches multi-string wildcard segments (e.g., +).
   * Captures all remaining segments joined by "/".
   */
  private matchMultiStringWildcard(segments: string[]): SegmentMatchResult | undefined {
    if (segments.length === 0) return undefined;
    for (const s of segments) {
      if (this.range && !this.inBracketRange(s, this.range)) {
        return undefined;
      }
    }
    return { leftover: [], wildcard: [segments.join("/")] };
  }

  /**
   * Matches optional wildcard segments (e.g., ?).
   * Captures one segment if present and valid, otherwise skips.
   */
  private matchOptionalWildcard(segments: string[]): SegmentMatchResult | undefined {
    if (segments.length === 0) {
      return { leftover: [] };
    }
    const [first, ...rest] = segments;
    if (this.range && !this.inBracketRange(first, this.range)) {
      // Skip capturing
      return { leftover: segments };
    }
    return { leftover: rest, wildcard: [first] };
  }

  // ───────────────────────────── Range Check ──────────────────────────────
  /**
   * Checks if a given value matches the bracket range.
   * Example: value = "a", rangeExpr = "[a-z]"
   */
  private inBracketRange(value: string, rangeExpr: string): boolean {
    // Remove enclosing brackets
    const body = rangeExpr.slice(1, -1); // e.g., "a-z"

    // Create a regex dynamically
    const re = new RegExp(`^[${body}]+$`, "i");
    return re.test(value);
  }

  // ───────────────────────────── Accessor ───────────────────────────────
  /**
   * Indicates whether the segment is optional.
   */
  public isOptional(): boolean {
    return this.optional;
  }

  /**
   * Indicates whether the segment is a parameter.
   */
  public isParam(): boolean {
    return this.segType === "param";
  }

  /**
   * Indicates whether the segment is a wildcard.
   */
  public isWildcard(): boolean {
    return this.segType === "wildcard";
  }
}