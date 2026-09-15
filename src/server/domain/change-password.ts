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

const changeOwnPasswordInputSchema = z
  .object({
    currentPassword: z.string().min(1, "Senha atual é obrigatória"),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Confirmação deve ser igual à nova senha",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "A nova senha deve ser diferente da senha atual",
    path: ["newPassword"],
  });

export interface ChangeOwnPasswordInput {
  currentPassword: string;
  newPassword: string;
}

export function parseChangeOwnPasswordInput(input: unknown): ChangeOwnPasswordInput {
  const data = changeOwnPasswordInputSchema.parse(input);
  return { currentPassword: data.currentPassword, newPassword: data.newPassword };
}
