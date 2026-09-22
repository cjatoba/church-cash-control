import { z } from "zod";

// Formato brasileiro sem código de país (DDI): DDD + número fixo (8
// dígitos) ou celular (9 dígitos) — decisão tomada com o usuário de não
// suportar formato internacional por ora.
export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((digits) => digits.length === 10 || digits.length === 11, {
    message: "Celular inválido",
  });

export type Phone = z.infer<typeof phoneSchema>;

export function formatPhoneLabel(digits: string): string {
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  const splitIndex = rest.length === 9 ? 5 : 4;
  return `(${ddd}) ${rest.slice(0, splitIndex)}-${rest.slice(splitIndex)}`;
}
