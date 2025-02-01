import { BaseDi } from "./mod.ts";

export function di<T = string>(
  key: string,
  ...args: unknown[]
): (
  value: { get: () => T; set: (value: T) => void },
  context: ClassAccessorDecoratorContext,
) => void {
  return (
    _value: { get: () => T; set: (value: T) => void },
    context: ClassAccessorDecoratorContext,
  ): { get?: () => T; set?: (value: T) => void } | void => {
    if (context.kind !== "accessor") return;

    return {
      get(): T {
        const val = BaseDi.create().resolve<T>(key, ...args);
        return val as T;
      },
      set(): void {
        throw new Error(
          `Cannot assign to dependency-injected property '${String(context.name)}'.`,
        );
      },
    };
  };
}
