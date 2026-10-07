import { Transform } from 'class-transformer';

/** Remove espaços nas extremidades de campos texto antes da validação. */
export const Trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
