import { z } from "zod";
import { userCapabilitiesSchema } from "./user-capabilities";

export const phoneSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  },
  z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((digits) => digits.length >= 10 && digits.length <= 13, {
      message: "Telefone inválido",
    })
    .optional(),
);

const userInviteSchema = z
  .object({
    email: z.email().transform((email) => email.toLowerCase()),
    phone: phoneSchema,
  })
  .and(userCapabilitiesSchema);

export type UserInvite = z.infer<typeof userInviteSchema>;

export function parseInvite(input: unknown): UserInvite {
  return userInviteSchema.parse(input);
}
