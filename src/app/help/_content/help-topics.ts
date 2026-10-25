import type { GuideItem } from "@/server/domain/onboarding";

// Fonte única dos textos da Ajuda. Toda mudança de tela ou fluxo precisa
// revisar este arquivo (regra do CLAUDE.md, seção "Ajuda e tutorial").

export interface HelpTopic extends GuideItem {
  slug: string;
  title: string;
  summary: string;
  steps: string[];
  tip?: string;
  action?: { href: string; label: string };
  related?: string[];
}

export interface HelpGroup {
  title: string;
  topicSlugs: string[];
}

const toCampaigns = { href: "/", label: "Ir para as campanhas" };

export const helpTopics: HelpTopic[] = [
  {
    slug: "criar-campanha",
    requires: "canManageCampaigns",
    title: "Criar uma campanha",
    summary: "Uma campanha reúne a meta, o período, os carnês e tudo que for recebido para ela.",
    steps: [
      'Na tela inicial, toque em "Nova campanha".',
      "Informe o nome, a meta (valor que se quer arrecadar) e as datas de início e de fim.",
      'Toque em "Criar campanha".',
      "Depois, cadastre os tipos de carnê e os doadores da campanha.",
    ],
    tip: 'Para mudar nome, meta ou período depois, entre na campanha e toque em "Editar nome, meta e período".',
    action: { href: "/campaigns/new", label: "Criar campanha agora" },
    related: ["tipos-de-carne", "editar-arquivar-campanha"],
  },
  {
    slug: "tipos-de-carne",
    requires: "canManageCampaigns",
    title: "Cadastrar tipos de carnê",
    summary:
      "O tipo de carnê define o valor de cada parcela, ou se o carnê é avulso (valor livre).",
    steps: [
      "Na tela inicial, toque na campanha.",
      'Em "Cadastros", toque em "Tipos de carnê".',
      'Dê um nome e informe o valor da parcela por mês, ou marque "Carnê avulso" se não tiver valor fixo.',
      'Toque em "Criar tipo de carnê".',
    ],
    tip: "Carnê de valor fixo gera uma parcela por mês. Carnê avulso não tem parcelas: o doador entrega o valor que juntar, quantas vezes quiser.",
    action: toCampaigns,
    related: ["cadastrar-doador"],
  },
  {
    slug: "cadastrar-doador",
    requires: "canReceiveFunds",
    title: "Cadastrar um doador e o carnê",
    summary: "Cada doador recebe um carnê de um dos tipos cadastrados na campanha.",
    steps: [
      "Na tela inicial, toque na campanha.",
      'Em "Cadastros", toque em "Doadores e carnês".',
      'Toque em "Cadastrar doador".',
      "Informe o nome e escolha o tipo de carnê.",
      'Se o carnê tiver valor fixo, confira o "Mês da primeira parcela" (já vem com o mês atual) e escolha "Até o fim da campanha" ou uma quantidade menor de parcelas.',
      'Toque em "Cadastrar doador e gerar carnê".',
    ],
    tip: 'Cadastrando um carnê que a pessoa pegou antes? Escolha em "Mês da primeira parcela" o mês em que ele começou. Os meses que já passaram ficam em "A pagar" para você dar baixa com a data certa. Se não aparecer nenhum tipo de carnê, peça a quem cuida da campanha para cadastrar um antes.',
    action: toCampaigns,
    related: ["dar-baixa", "entrega-carne-avulso", "corrigir-tipo-carne"],
  },
  {
    slug: "corrigir-tipo-carne",
    requires: "canReceiveFunds",
    title: "Corrigir o tipo de carnê de um doador",
    summary: "Para quando o carnê foi cadastrado com o tipo errado.",
    steps: [
      "Abra o carnê do doador (campanha → Doadores e carnês → nome do doador).",
      'No fim da tela, em "Ajustes do carnê", toque em "Corrigir tipo de carnê".',
      "Escolha o tipo certo e confira o aviso que explica o que vai mudar.",
      'Toque em "Salvar tipo novo".',
    ],
    tip: "Entre tipos de valor fixo, as parcelas a pagar ganham o valor novo, e o que já foi pago é recontado no valor novo quando fecha certinho (ex.: R$ 100 pagos viram duas parcelas pagas de R$ 50). Trocar entre valor fixo e avulso só é possível enquanto nada foi pago ou entregue.",
    action: toCampaigns,
    related: ["cadastrar-doador"],
  },
  {
    slug: "dar-baixa",
    requires: "canReceiveFunds",
    title: "Dar baixa numa parcela",
    summary: "Use quando um doador pagar uma parcela do carnê.",
    steps: [
      "Na tela inicial, toque na campanha.",
      'Toque em "Registrar recebimento" e escolha "Parcela de carnê".',
      "Encontre o doador na lista e toque no nome dele.",
      'Na aba "A pagar", toque em "Dar baixa" na parcela.',
      "Confira a data, a forma de pagamento (Pix ou dinheiro) e quem recebeu, e confirme.",
    ],
    tip: 'Errou a data, a forma de pagamento ou quem recebeu? Na aba "Pagas", toque em "Editar" na parcela para corrigir ou voltar para pendente.',
    action: toCampaigns,
    related: ["corrigir-baixa", "dinheiro-em-maos"],
  },
  {
    slug: "entrega-carne-avulso",
    requires: "canReceiveFunds",
    title: "Registrar entrega de carnê avulso",
    summary: "Use quando um doador com carnê avulso entregar o valor que juntou.",
    steps: [
      "Na tela inicial, toque na campanha.",
      'Toque em "Registrar recebimento" e escolha "Entrega de carnê avulso".',
      "Toque no nome do doador.",
      'Toque em "Registrar entrega" e informe o valor, a data, a forma de pagamento e quem recebeu.',
    ],
    tip: 'Quando o doador não for entregar mais nada, toque em "Encerrar carnê". Dá para reabrir depois, se precisar.',
    action: toCampaigns,
    related: ["dinheiro-em-maos"],
  },
  {
    slug: "doacao-sem-carne",
    requires: "canReceiveFunds",
    title: "Registrar doação sem carnê",
    summary: "Para uma oferta pontual de quem não tem carnê. Pode ter nome ou ser anônima.",
    steps: [
      "Na tela inicial, toque na campanha.",
      'Toque em "Registrar recebimento" e escolha "Doação sem carnê".',
      "Informe o valor, a data, a forma de pagamento e quem recebeu.",
      'O nome de quem doou é opcional: deixe em branco para ficar anônima. Toque em "Registrar doação".',
    ],
    action: toCampaigns,
    related: ["dinheiro-em-maos"],
  },
  {
    slug: "corrigir-baixa",
    requires: "canReceiveFunds",
    title: "Corrigir ou desfazer uma baixa",
    summary:
      "Para quando a data, a forma de pagamento ou quem recebeu foi informado errado, ou a baixa foi dada sem querer.",
    steps: [
      "Abra o carnê do doador (campanha → Doadores e carnês → nome do doador).",
      'Na aba "Pagas", toque em "Editar" na parcela.',
      'Para corrigir, ajuste a data, a forma de pagamento ou quem recebeu e toque em "Salvar correção".',
      'Para desfazer, use "Deu baixa sem querer?" e confirme. A parcela volta para "A pagar".',
    ],
    tip: "Não dá para trocar quem recebeu nem desfazer a baixa se esse dinheiro já foi repassado. Corrija o repasse primeiro.",
    action: toCampaigns,
    related: ["dar-baixa", "corrigir-entrada"],
  },
  {
    slug: "corrigir-entrada",
    requires: "canReceiveFunds",
    title: "Corrigir ou excluir uma doação, entrega ou repasse",
    summary:
      "Para quando um valor foi lançado errado: quem recebeu, valor, data ou forma de pagamento — ou lançado por engano.",
    steps: [
      'Na campanha, em "Acompanhar", toque em "Dinheiro em mãos".',
      "Toque na pessoa que aparece com o valor errado.",
      'Na aba "Recebeu", toque em "Corrigir" na doação ou entrega. Para um repasse, use a aba "Repassou".',
      'Ajuste o que estiver errado e toque em "Salvar correção". Se foi lançado por engano, use "Excluir" e confirme.',
    ],
    tip: 'Para parcela de carnê, toque em "Ver no carnê" e corrija por lá. Não dá para tirar um valor de quem já o repassou: corrija o repasse primeiro. Toda correção fica no Registro de atividades.',
    action: toCampaigns,
    related: ["dinheiro-em-maos", "corrigir-baixa"],
  },
  {
    slug: "quem-pagou-no-mes",
    title: "Ver quem pagou no mês",
    summary: "Mostra a meta do mês, quem já pagou e quem ainda tem parcela pendente.",
    steps: [
      "Na tela inicial, toque na campanha.",
      'Em "Acompanhar", toque em "Quem pagou no mês".',
      "Troque o mês no seletor do topo para ver outro mês da campanha.",
    ],
    action: toCampaigns,
  },
  {
    slug: "dinheiro-em-maos",
    title: "Dinheiro em mãos e repasses",
    summary: "Mostra com quem está cada valor recebido e os repasses feitos entre as pessoas.",
    steps: [
      "Na tela inicial, toque na campanha.",
      'Em "Acompanhar", toque em "Dinheiro em mãos".',
      "Veja quanto cada pessoa recebeu e ainda está com ela.",
      "Toque numa pessoa para ver de onde veio cada valor (parcela, doação ou entrega) e os repasses que ela fez.",
      'Quando o dinheiro passar para outra pessoa (ou for usado numa compra), toque em "Repassar", informe o valor, para quem e a data.',
    ],
    tip: "Só quem registra recebimentos consegue registrar e corrigir repasses.",
    action: toCampaigns,
    related: ["corrigir-entrada"],
  },
  {
    slug: "editar-arquivar-campanha",
    requires: "canManageCampaigns",
    title: "Editar ou arquivar uma campanha",
    summary: "Mude nome, meta ou período, ou tire da tela inicial uma campanha que acabou.",
    steps: [
      "Na tela inicial, toque na campanha.",
      'Em "Configurações da campanha", toque em "Editar nome, meta e período" ou em "Arquivar campanha".',
    ],
    tip: "Arquivar não apaga nada. A campanha aparece em separado na tela inicial e pode ser reativada.",
    action: toCampaigns,
  },
  {
    slug: "trocar-senha",
    title: "Trocar minha senha",
    summary: "Para definir uma senha nova quando quiser.",
    steps: [
      'Toque no botão de menu (canto de cima da tela inicial) e depois em "Trocar senha".',
      "Informe a senha atual e a nova senha duas vezes.",
      "Depois de salvar, entre de novo com a senha nova.",
    ],
    tip: "Esqueceu a senha? Peça a quem cuida dos voluntários para gerar uma senha nova para você.",
    action: { href: "/account/password", label: "Trocar senha agora" },
  },
  {
    slug: "instalar-no-celular",
    title: "Instalar no celular",
    summary: "Coloque o app na tela inicial do celular e abra como um aplicativo.",
    steps: [
      'Toque no botão de menu e depois em "Instalar no celular".',
      "Escolha a aba do seu celular (Android ou iPhone) e siga os passos.",
    ],
    action: { href: "/install", label: "Ver como instalar" },
  },
  {
    slug: "modo-escuro",
    title: "Modo claro ou escuro",
    summary: "Escolha as cores do app.",
    steps: [
      'Toque no botão de menu e, em "Aparência", escolha Automático, Claro ou Escuro.',
      '"Automático" segue o modo claro ou escuro do seu celular.',
    ],
    action: { href: "/menu", label: "Abrir o menu" },
  },
  {
    slug: "convidar-voluntarios",
    requires: "canManageUsers",
    title: "Convidar voluntários",
    summary: "Cadastre quem ajuda na campanha e escolha o que cada pessoa pode fazer.",
    steps: [
      'Toque no botão de menu e depois em "Voluntários e acessos".',
      'Toque em "Cadastrar voluntário" e informe o nome.',
      "Se a pessoa for usar o app, marque a opção de acesso, informe o celular e o que ela pode fazer.",
      'Toque em "Enviar pelo WhatsApp" e envie a mensagem pronta, que já leva o link, o celular e a senha temporária. No primeiro acesso, a pessoa cria a própria senha.',
    ],
    tip: 'Quem não usa o app (sem celular, por exemplo) pode ser cadastrado só com o nome, para aparecer em "Recebido por".',
    action: { href: "/users", label: "Ver voluntários" },
  },
  {
    slug: "personalizar-app",
    requires: "canManageUsers",
    title: "Personalizar nome e ícone",
    summary: "Mude o nome do app e o ícone que aparece no celular.",
    steps: [
      'Toque no botão de menu e depois em "Personalizar app".',
      "Escolha o nome, o nome curto, o ícone e a cor, e toque em Salvar.",
    ],
    tip: "No iPhone, quem já instalou o app precisa remover e instalar de novo para ver o ícone novo.",
    action: { href: "/app-settings", label: "Personalizar agora" },
  },
  {
    slug: "registro-de-atividades",
    requires: "canManageUsers",
    title: "Registro de atividades",
    summary:
      "Mostra quem fez o quê e quando: recebimentos, repasses, cadastros, mudanças nas campanhas e nos voluntários, e cada correção com o que era antes e o que ficou.",
    steps: ['Toque no botão de menu e depois em "Registro de atividades".'],
    action: { href: "/activity-log", label: "Ver registro" },
  },
];

export const helpGroups: HelpGroup[] = [
  {
    title: "Primeiros passos",
    topicSlugs: ["criar-campanha", "tipos-de-carne", "cadastrar-doador", "corrigir-tipo-carne"],
  },
  {
    title: "Recebimentos",
    topicSlugs: [
      "dar-baixa",
      "entrega-carne-avulso",
      "doacao-sem-carne",
      "corrigir-baixa",
      "corrigir-entrada",
    ],
  },
  {
    title: "Acompanhar",
    topicSlugs: ["quem-pagou-no-mes", "dinheiro-em-maos", "editar-arquivar-campanha"],
  },
  {
    title: "Conta e administração",
    topicSlugs: [
      "trocar-senha",
      "instalar-no-celular",
      "modo-escuro",
      "convidar-voluntarios",
      "personalizar-app",
      "registro-de-atividades",
    ],
  },
];

export function findHelpTopic(slug: string): HelpTopic | undefined {
  return helpTopics.find((topic) => topic.slug === slug);
}
