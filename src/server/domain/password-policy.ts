import { z } from "zod";

export const passwordSchema = z.string().min(8, "Senha deve ter pelo menos 8 caracteres");
