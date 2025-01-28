import console from "node:console";

import { resolve, join } from "jsr:@std/path@^1.0.0";
import { exists } from "jsr:@std/fs@^1.0.0";

import { merge } from "@basef/utils";

// deno-lint-ignore no-explicit-any
type ConfigObject = Record<string, any>;

export class BaseConfig {
  private static _config: ConfigObject = {};
  private static _templates: ConfigObject = {};

  private static _fsRoot: string;
  private static _env?: string;

  private _ns: string;

  public static async init(configDir: string, env?: string): Promise<void> {
    this._fsRoot = resolve(configDir);
    this._env = env;

    await this.loadTemplates();

    const baseConfig = await this.loadAndApplyTemplates("default");

    let envConfig: ConfigObject = {};
    if (this._env) {
      envConfig = await this.loadAndApplyTemplates(this._env);
    }

    this._config = merge(baseConfig, envConfig);
  }

  public constructor(namespace: string) {
    this._ns = namespace;
  }

  public getConfig(): ConfigObject {
    return BaseConfig.getNamespace(this._ns);
  }

  public get<T = string>(key: string): T | undefined;
  public get<T = string>(key: string, defaultValue: T): T;
  public get<T = string>(key: string, defaultValue?: T): T | undefined {
    const val = this.getConfig()[key] as T;
    return val !== undefined ? val : defaultValue;
  }

  public static getNamespace(ns: string): ConfigObject {
    if (!this._config[ns]) {
      console.debug(`Namespace '${ns}' not found in configuration.`);
    }
    return this._config[ns] ?? {};
  }

  private static async load(config: string): Promise<ConfigObject> {
    const configFile = resolve(join(this._fsRoot, `${config}.ts`));
    if (!configFile.startsWith(this._fsRoot)) {
      throw new Error("Invalid configuration file path.");
    }

    try {
      if (!await exists(configFile, { isReadable: true })) return {};
    } catch (_e) {
      return {};
    }

    return import(configFile).then((module) => module.default as ConfigObject);
  }

  private static async loadTemplates(): Promise<void> {
    try {
      this._templates = await this.load("templates");
    } catch (e) {
      console.warn(`Failed to load templates configuration: ${(e as Error).message}`);
    }
  }

  private static async loadAndApplyTemplates(
    configName: string,
  ): Promise<ConfigObject> {
    let config = await this.load(configName);
    config = this.applyTemplatesToConfig(config);
    return config;
  }

  private static applyTemplatesToConfig(config: ConfigObject, depth = 0): ConfigObject {
    const MAX_DEPTH = 20;
  
    const applyTemplatesRecursively = (obj: ConfigObject, currentDepth: number): ConfigObject => {
      if (typeof obj !== "object" || obj === null) return obj;
  
      if (currentDepth > MAX_DEPTH) {
        throw new Error(`Template application exceeded maximum depth of ${MAX_DEPTH}. Possible circular reference.`);
      }

      let result: ConfigObject = {};
      if (obj._T) {
        const templateName = obj._T as string;
        const templateConfig = this._templates[templateName];
        if (!templateConfig) {
          console.warn(`Template '${templateName}' not found.`);
        } else {
          result = applyTemplatesRecursively({ ...templateConfig }, currentDepth + 1);
        }
      }
  
      Object.keys(obj).forEach((key) => {
        if (key === "_T") return; // **Remove `_T` after processing**
  
        const value = obj[key];
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          result[key] = merge(
            { ...result[key] },
            applyTemplatesRecursively({ ...value }, currentDepth + 1),
          );
        } else {
          result[key] = value;
        }
      });
  
      return result;
    };
  
    return applyTemplatesRecursively(config, depth);
  }
}
