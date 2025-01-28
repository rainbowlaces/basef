import { truncate } from "@basef/utils";
import type { LogMessage } from "./logMessage.ts";
import { ContextTransformer } from "./serialization/contextTransformer.ts";

import type { LogContext, SerializedLogMessage } from "./types.ts";

export type LogMessageSerializerConfig = {
  maxMessageLength?: number;
  maxContextDepth?: number;
  maxItemsPerLevel?: number;
};

export interface LogMessageSerializer {
  init(config: LogMessageSerializerConfig): void;
  serialize(logMessage: LogMessage): SerializedLogMessage;
}

export class DefaultLogMessageSerializer implements LogMessageSerializer {
  private config: Required<LogMessageSerializerConfig> = {
    maxMessageLength: 1024,
    maxContextDepth: 10,
    maxItemsPerLevel: 100,
  };

  private contextTransformer: ContextTransformer | undefined;

  init(config: LogMessageSerializerConfig): void {
    this.config = { ...this.config, ...config };

    this.contextTransformer = new ContextTransformer({
      maxLength: this.config.maxMessageLength,
      maxDepth: this.config.maxContextDepth,
      maxItems: this.config.maxItemsPerLevel,
    });
  }

  public serialize(logMessage: LogMessage): SerializedLogMessage {
    const transformedContext = this.contextTransformer?.transform(
      logMessage.context,
    ) as LogContext;

    return {
      timestamp: logMessage.timestamp,
      level: logMessage.level,
      namespace: logMessage.namespace,
      message: truncate(logMessage.message, this.config.maxMessageLength),
      tags: logMessage.tags,
      context: transformedContext,
    };
  }
}
