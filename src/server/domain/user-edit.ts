import { z } from "zod";
import { phoneSchema } from "./user-invite";
import { userRoleSchema } from "./user-role";

const userEditSchema = z.object({
  email: z.email().transform((email) => email.toLowerCase()),
  phone: phoneSchema,
  role: userRoleSchema,
});

export type UserEdit = z.infer<typeof userEditSchema>;

export function parseUserEdit(input: unknown): UserEdit {
  return userEditSchema.parse(input);
}
