const BRAZIL_COUNTRY_CODE = "55";

function toWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length <= 11 ? `${BRAZIL_COUNTRY_CODE}${digits}` : digits;
}

export function buildTemporaryPasswordWhatsAppLink(
  phone: string,
  email: string,
  temporaryPassword: string,
  loginUrl: string,
): string {
  const message =
    `Você foi cadastrado no Controle de Caixa da igreja.\n` +
    `Acesse ${loginUrl} com o e-mail ${email} e a senha temporária ${temporaryPassword}.\n` +
    `Você vai precisar trocar essa senha no primeiro acesso.`;

  return `https://wa.me/${toWhatsAppPhone(phone)}?text=${encodeURIComponent(message)}`;
}
