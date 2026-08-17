import { test } from '@playwright/test';

/**
 * Wraps a page-object method in a `test.step`, so the HTML report shows the
 * action instead of a flat list of clicks.
 *
 * Standard (ES2022) decorator syntax — `experimentalDecorators` is deliberately
 * not enabled.
 *
 *   @Step('Sign in as {0}')
 *   async login(user: string) { ... }
 *
 * `{0}`, `{1}`, ... are replaced with the call arguments. Without a name the
 * step is reported as `ClassName.methodName(args)`.
 */
export function Step(stepName?: string) {
  return function <This, Args extends unknown[], Return>(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>
  ) {
    return async function (this: This, ...args: Args): Promise<Return> {
      const format = (arg: unknown): string =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg);

      const name = stepName
        ? args.reduce<string>((acc, arg, index) => acc.replace(`{${index}}`, format(arg)), stepName)
        : `${(this as { constructor: { name: string } }).constructor.name}.${String(context.name)}(${args.map(format).join(', ')})`;

      return test.step(name, async () => target.call(this, ...args));
    };
  };
}
