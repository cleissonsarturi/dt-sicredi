import { registerDecorator, type ValidationOptions } from 'class-validator';

export function hojeIso(): string {
  const agora = new Date();
  const offsetMs = agora.getTimezoneOffset() * 60_000;
  return new Date(agora.getTime() - offsetMs).toISOString().slice(0, 10);
}

export function NaoFutura(options?: ValidationOptions) {
  return (target: object, propertyName: string) =>
    registerDecorator({
      name: 'naoFutura',
      target: target.constructor,
      propertyName,
      options: {
        message: `${propertyName} não pode ser uma data futura`,
        ...options,
      },
      validator: {
        validate: (value: unknown) =>
          typeof value !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
          value <= hojeIso(),
      },
    });
}
