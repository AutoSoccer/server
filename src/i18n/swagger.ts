import i18next from 'i18next';

import { DEFAULT_LOCALE } from '../plugins/i18n';

/**
 * Resolve uma chave do namespace `swagger` no locale default do servidor.
 * Usado por `*.routes.ts` para traduzir `summary` / `description` de cada
 * endpoint quando a spec OpenAPI e construida (WS-03).
 *
 * A spec e gerada uma unica vez no boot do Fastify (estrategia OPCAO A do
 * WS-03), portanto as strings sao "fixadas" no idioma default. Para suporte
 * a `?lang=` na rota `/docs/json` (OPCAO B), e necessario regerar a spec
 * usando um locale dinamico — fica registrado como follow-up no WS-03.
 */
export const tSwagger = (key: string): string => {
  const fixedT = i18next.getFixedT(DEFAULT_LOCALE, 'swagger');
  return fixedT(key) as unknown as string;
};
