import { z } from "zod";
import { passwordSchema } from "./password-policy";

const credentialsSchema = z.object({
  email: z.email().transform((email) => email.toLowerCase()),
  password: passwordSchema,
});

export type Credentials = z.infer<typeof credentialsSchema>;

export function parseCredentials(input: unknown): Credentials {
  return credentialsSchema.parse(input);
}
