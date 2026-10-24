import { z } from "zod";
import { passwordSchema } from "./password-policy";
import { phoneSchema } from "./phone";

const credentialsSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
});

export type Credentials = z.infer<typeof credentialsSchema>;

export function parseCredentials(input: unknown): Credentials {
  return credentialsSchema.parse(input);
}
