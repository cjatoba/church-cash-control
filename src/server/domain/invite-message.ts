import { greetByFirstName } from "./greeting";
import { formatPhoneLabel } from "./phone";

const BRAZIL_COUNTRY_CODE = "55";

export type AccessMessageKind = "invite" | "password-reset";

export interface AccessMessage {
  kind: AccessMessageKind;
  name: string;
  phone: string;
  appName: string;
  temporaryPassword: string;
  loginUrl: string;
}

function toWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length <= 11 ? `${BRAZIL_COUNTRY_CODE}${digits}` : digits;
}

// Asteriscos são o negrito do próprio WhatsApp; cada item do array vira um
// parágrafo, separado por uma única linha em branco.
function buildParagraphs(message: AccessMessage): string[] {
  const greeting = `${greetByFirstName(message.name)} 👋`;
  const loginSteps = (passwordLabel: string) =>
    [
      `1️⃣ Abra o link: ${message.loginUrl}`,
      `2️⃣ Celular: *${formatPhoneLabel(message.phone)}*`,
      `3️⃣ ${passwordLabel}: *${message.temporaryPassword}*`,
    ].join("\n");

  if (message.kind === "password-reset") {
    return [
      greeting,
      `Sua senha do *${message.appName}* foi redefinida.`,
      `*Para entrar:*\n${loginSteps("Nova senha temporária")}`,
      "Ao entrar, o app vai pedir para você criar uma senha nova só sua. 🔒",
      "Se não foi você quem pediu, avise a gente respondendo esta mensagem. 🙏",
    ];
  }

  return [
    greeting,
    `Você recebeu acesso ao *${message.appName}*, o app que usamos para acompanhar as campanhas da igreja.`,
    `*Como entrar:*\n${loginSteps("Senha temporária")}`,
    "No primeiro acesso, o app vai pedir para você criar uma senha só sua. 🔒",
    "💡 Dica: depois de entrar, toque em *Menu → Instalar no celular* para ter o app na tela inicial.",
    "Qualquer dúvida, é só responder esta mensagem. Deus abençoe! 🙏",
  ];
}

export function buildAccessWhatsAppLink(message: AccessMessage): string {
  const text = buildParagraphs(message).join("\n\n");
  return `https://wa.me/${toWhatsAppPhone(message.phone)}?text=${encodeURIComponent(text)}`;
}
