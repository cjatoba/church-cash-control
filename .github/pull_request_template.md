## O que muda e por quê

<!-- Descreva a mudança e a motivação/regra de negócio por trás dela. -->

## Como testar

<!-- Passos manuais, se houver, além dos testes automatizados. -->

## Checklist

- [ ] Testes escritos antes da implementação (TDD) e cobrindo a regra de negócio
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test:coverage` e `pnpm build` passam localmente
- [ ] Nenhum uso de `any`/`unknown` não tratado foi introduzido
- [ ] Migrations do banco (se houver mudança de schema) foram geradas e commitadas
- [ ] Documentação (`README.md`/`CLAUDE.md`/`ROADMAP.md`) atualizada, se aplicável
- [ ] Textos da Ajuda (`src/app/help/_content/help-topics.ts`) e do tutorial revisados: nenhum descreve botão, nome ou caminho que mudou
