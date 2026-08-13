import { test } from '@playwright/test';

export function Step(stepName?: string) {
  return function (
    _target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      let name = stepName;

      if (name) {
        // Подставляем аргументы {0}, {1} в переданный stepName
        args.forEach((arg, index) => {
          const paramValue = typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
          name = name!.replace(`{${index}}`, paramValue);
        });
      } else {
        // Безопасное форматирование аргументов, если stepName не передан
        const formattedArgs = args
          .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
          .join(', ');
        
        name = `${this.constructor.name}.${propertyKey}(${formattedArgs})`;
      }

      return await test.step(name, async () => {
        return await originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}