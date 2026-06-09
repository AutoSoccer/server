import path from 'node:path';

import { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import i18next, { type TFunction } from 'i18next';
import FsBackend from 'i18next-fs-backend';
// O pacote i18next-http-middleware fica registrado como dependencia para
// projetos que queiram usar o middleware-style direto (Express/Koa). No
// Fastify, optamos pelo hook `onRequest` proprio por ter integracao mais
// limpa e por garantir ordem deterministica em relacao a outros plugins.

export const SUPPORTED_LOCALES = ['pt-BR', 'en'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'pt-BR';

export const NAMESPACES = [
  'common',
  'abilities',
  'auth',
  'equipe',
  'itens',
  'mercado',
  'partida',
  'ranking',
  'simulador',
  'swagger'
] as const;
export type Namespace = (typeof NAMESPACES)[number];

declare module 'fastify' {
  interface FastifyRequest {
    /**
     * Funcao de traducao decorada pelo plugin i18n. Resolve `key` no idioma ativo
     * (Accept-Language ou ?lang=) usando os namespaces declarados em
     * `src/i18n/locales/<locale>/<namespace>.json`.
     */
    t: TFunction;
    /** Locale ativo da requisicao apos negociacao (Accept-Language, ?lang=, default). */
    locale: SupportedLocale;
  }
}

/**
 * Normaliza tags de idioma vindas do header/query para um dos locales suportados.
 * Aceita variacoes como "pt", "pt-BR", "pt-PT" -> "pt-BR"; "en", "en-US" -> "en".
 */
const normalizeLocale = (raw: string | undefined | null): SupportedLocale => {
  if (!raw) {
    return DEFAULT_LOCALE;
  }
  const normalized = raw.trim().toLowerCase();
  if (normalized.startsWith('pt')) {
    return 'pt-BR';
  }
  if (normalized.startsWith('en')) {
    return 'en';
  }
  return DEFAULT_LOCALE;
};

/**
 * Parser simples de Accept-Language com pesos `q=`. Retorna o primeiro locale
 * suportado de acordo com a preferencia do cliente.
 */
const pickFromAcceptLanguage = (header: string | undefined): SupportedLocale | null => {
  if (!header) {
    return null;
  }

  const parts = header
    .split(',')
    .map((entry) => {
      const [tag, ...params] = entry.trim().split(';');
      const qParam = params.find((p) => p.trim().startsWith('q='));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return { tag: tag.trim(), q: Number.isFinite(q) ? q : 1 };
    })
    .filter((entry) => entry.tag.length > 0 && entry.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of parts) {
    const normalized = normalizeLocale(tag);
    if (SUPPORTED_LOCALES.includes(normalized)) {
      return normalized;
    }
  }
  return null;
};

const resolveLocale = (request: FastifyRequest): SupportedLocale => {
  // 1. Header Accept-Language (preferencia principal).
  const fromHeader = pickFromAcceptLanguage(request.headers['accept-language']);
  if (fromHeader) {
    return fromHeader;
  }

  // 2. Query string ?lang=
  const queryLang =
    typeof request.query === 'object' && request.query !== null
      ? (request.query as { lang?: unknown }).lang
      : undefined;
  if (typeof queryLang === 'string' && queryLang.trim().length > 0) {
    return normalizeLocale(queryLang);
  }

  // 3. Default.
  return DEFAULT_LOCALE;
};

let initialized = false;

/**
 * Plugin Fastify de i18n. Inicializa o i18next com o backend de filesystem,
 * registra o middleware de deteccao de idioma e expoe `req.t` / `req.locale`.
 *
 * Deve ser registrado ANTES do `registerErrorHandler` para que o handler global
 * consiga traduzir mensagens de erro de servico via `req.t(error.code)`.
 */
export const registerI18n = async (app: FastifyInstance): Promise<void> => {
  const localesPath = path.resolve(__dirname, '..', 'i18n', 'locales');

  if (!initialized) {
    // O tipo do i18next exige `as any` por causa do init options exposto pelo
    // backend de FS; o objeto e o mesmo da documentacao oficial.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await i18next
      .use(FsBackend)
      .init({
        backend: {
          loadPath: path.join(localesPath, '{{lng}}', '{{ns}}.json')
        },
        // Idioma "ativo" do i18next no boot; cada requisicao usa
        // `getFixedT(locale)` para forcar o idioma correto sem depender deste.
        lng: DEFAULT_LOCALE,
        // Pre-carrega todos os locales/namespaces para evitar a primeira
        // requisicao pagar o custo de IO e para detectar JSONs malformados no boot.
        preload: [...SUPPORTED_LOCALES],
        ns: [...NAMESPACES],
        defaultNS: 'common',
        fallbackLng: DEFAULT_LOCALE,
        supportedLngs: [...SUPPORTED_LOCALES],
        // Em producao o servidor reinicia em mudancas; em dev/test e mais
        // simples logar sem warnings sobre missing keys.
        saveMissing: false,
        returnNull: false,
        detection: {
          order: ['header', 'querystring'],
          lookupQuerystring: 'lang',
          caches: false
        },
        interpolation: {
          escapeValue: false
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    // Garante que todos os namespaces estejam carregados antes de aceitar
    // requisicoes (caso o preload assincrono nao esteja completo).
    await i18next.loadNamespaces([...NAMESPACES]);
    await i18next.loadLanguages([...SUPPORTED_LOCALES]);
    initialized = true;
  }

  app.addHook('onRequest', async (request: FastifyRequest, _reply: FastifyReply) => {
    const locale = resolveLocale(request);
    request.locale = locale;
    request.t = buildTranslator(locale);
  });
};

/**
 * Adapta a `t` do i18next para o formato hierarquico de chaves usado pelo
 * server (`<namespace>.<key>[.<subkey>...]`). O i18next, por padrao, separa
 * namespace e chave por `:`; aqui interpretamos o primeiro `.` como divisor
 * para manter o estilo `auth.tokenMissing` espalhado por todo o codigo.
 */
const buildTranslator = (locale: SupportedLocale): TFunction => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const translator = ((key: string, options?: any) => {
    const fixedKey = normalizeKey(key);
    return i18next.getFixedT(locale)(fixedKey, options);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as unknown as TFunction;
  return translator;
};

const normalizeKey = (key: string): string => {
  if (typeof key !== 'string' || key.length === 0) {
    return key;
  }
  const dotIndex = key.indexOf('.');
  if (dotIndex <= 0) {
    return key;
  }
  const namespace = key.slice(0, dotIndex);
  if (!(NAMESPACES as readonly string[]).includes(namespace)) {
    return key;
  }
  const rest = key.slice(dotIndex + 1);
  return `${namespace}:${rest}`;
};
