import { z } from "zod";
import { passwordSchema } from "./password-policy";

const newPasswordInputSchema = z
  .object({
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Confirmação deve ser igual à nova senha",
    path: ["confirmNewPassword"],
  });

export interface NewPassword {
  newPassword: string;
}

export function parseNewPassword(input: unknown): NewPassword {
  const data = newPasswordInputSchema.parse(input);
  return { newPassword: data.newPassword };
}
