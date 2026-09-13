import { z } from "zod";
import { phoneSchema } from "./user-invite";
import { userCapabilitiesSchema } from "./user-capabilities";

const userEditSchema = z
  .object({
    email: z.email().transform((email) => email.toLowerCase()),
    phone: phoneSchema,
  })
  .and(userCapabilitiesSchema);

export type UserEdit = z.infer<typeof userEditSchema>;

export function parseUserEdit(input: unknown): UserEdit {
  return userEditSchema.parse(input);
}
