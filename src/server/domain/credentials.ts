import { z } from "zod";

const credentialsSchema = z.object({
  email: z.email().transform((email) => email.toLowerCase()),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

export type Credentials = z.infer<typeof credentialsSchema>;

export function parseCredentials(input: unknown): Credentials {
  return credentialsSchema.parse(input);
}
