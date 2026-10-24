import { z } from "zod";
import { phoneSchema } from "./phone";
import { userCapabilitiesSchema } from "./user-capabilities";

const userActivationSchema = z
  .object({
    phone: phoneSchema,
  })
  .and(userCapabilitiesSchema);

export type UserActivation = z.infer<typeof userActivationSchema>;

export function parseUserActivation(input: unknown): UserActivation {
  return userActivationSchema.parse(input);
}
