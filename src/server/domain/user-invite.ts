import { z } from "zod";
import { phoneSchema } from "./phone";
import { userCapabilitiesSchema } from "./user-capabilities";

const userInviteSchema = z
  .object({
    phone: phoneSchema,
  })
  .and(userCapabilitiesSchema);

export type UserInvite = z.infer<typeof userInviteSchema>;

export function parseInvite(input: unknown): UserInvite {
  return userInviteSchema.parse(input);
}
