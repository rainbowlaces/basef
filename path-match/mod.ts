import { PathSegment } from "./pathSegment.ts";
import { SegmentMatcher } from "./segmentMatcher.ts";

export class PathMatchResult {
  constructor(
    public readonly path: string,
    public readonly params: Record<string, string | string[]>,
    public readonly wildcard: string[],
    public readonly matched: boolean
  ) {}
}

/**
 * BasePathMatcher is responsible for matching URI paths against a predefined pattern.
 * It parses the pattern into segments and uses SegmentMatcher to perform matching.
 */
export class BasePathMatcher {
  private matchers: SegmentMatcher[];
  private pattern: string;
  private isRoot: boolean = false;

  constructor(pattern: string) {
    this.matchers = this.parsePattern(pattern).map((seg) => new SegmentMatcher(seg));
    this.pattern = this.normalizePath(pattern);
    if (this.pattern === '/') this.isRoot = true;
    this.checkParams(this.matchers);
  }    

  private checkParams(matchers: SegmentMatcher[]): void {
    const paramNames = new Set<string>();
    for (const matcher of matchers) {
      if (matcher.segType === "param") {
        if (paramNames.has(matcher.name!)) {
          throw new Error(`Duplicate parameter name: ${matcher.name}`);
        }
        paramNames.add(matcher.name!);
      }
    }    
  }

  private normalizePath(path: string): string {
    return '/' + path.toLowerCase().split('/').map((s) => s.trim()).filter(s => !!s).join('/');
  }

  private getSegments(path: string): string[] {
    return this.normalizePath(path).split('/').slice(1);
  }

  /**
   * Parses the pattern into PathSegment instances.
   */
  private parsePattern(pattern: string): PathSegment[] {
    if (pattern === '/') return [new PathSegment(pattern)];
    const segments = this.getSegments(pattern);
    return segments.map((seg) => new PathSegment(seg));
  }

  /**
   * Matches the given URI path against the pattern.
   */
  public match(uri: string): PathMatchResult {
    if (this.isRoot && this.normalizePath(uri) === '/') {
      return new PathMatchResult('/', {}, [], true);
    }
    const uriSegments = this.getSegments(uri);
    const wildcard: string[] = [];
    const params: Record<string, string | string[]> = {};
  
    let remainingSegments = [...uriSegments];
    let isMatched = true; // Flag to indicate overall match status
  
    for (const matcher of this.matchers) {
      if (remainingSegments.length === 0) {
        // Check if the matcher can match empty segments (e.g., optional)
        if (matcher.isOptional()) {
          continue;
        } else {
          // Pattern expects more segments but URI has none
          isMatched = false;
          break;
        }
      }
  
      const result = matcher.match(remainingSegments);
      if (!result) {
        // Mismatch found
        isMatched = false;
        break;
      }
  
      // Extract parameters
      if (result.paramName && result.paramValue !== undefined) {
        params[result.paramName] = result.paramValue;
      }
  
      // Extract wildcards
      if (result.wildcard) {
        wildcard.push(...result.wildcard);
      }
  
      // Update remaining segments
      remainingSegments = result.leftover;
    }
  
    // After processing all matchers, ensure no leftover segments remain
    if (isMatched && remainingSegments.length > 0) {
      isMatched = false;
    }
  
    return new PathMatchResult('/' + uriSegments.join('/'), isMatched ? params : {}, isMatched ? wildcard : [], isMatched);
  }
}