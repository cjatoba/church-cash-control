import { z } from "zod";
import { phoneSchema } from "./phone";
import { userCapabilitiesSchema } from "./user-capabilities";

const userEditSchema = z
  .object({
    phone: phoneSchema,
  })
  .and(userCapabilitiesSchema);

export type UserEdit = z.infer<typeof userEditSchema>;

export function parseUserEdit(input: unknown): UserEdit {
  return userEditSchema.parse(input);
}
