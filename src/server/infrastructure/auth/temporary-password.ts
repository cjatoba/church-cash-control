import { randomInt } from "node:crypto";

// Exclui caracteres ambíguos (0/O, 1/l/I) para reduzir erro de digitação ao repassar por telefone.
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const LENGTH = 10;

export function generateTemporaryPassword(): string {
  let password = "";
  for (let i = 0; i < LENGTH; i++) {
    password += CHARSET.charAt(randomInt(CHARSET.length));
  }
  return password;
}
