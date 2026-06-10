#!/usr/bin/env node
/**
 * Valida paridade de chaves entre os locales pt-BR e en do servidor.
 * Falha (exit 1) se houver chaves ou namespaces faltando em qualquer lado.
 *
 * Espelha a logica do script equivalente do front (`front/scripts/check-i18n.mjs`)
 * para que a equipe rode `yarn i18n:check` em ambos os repositorios.
 */

import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = resolve(__dirname, "..", "src", "i18n", "locales");

const baseLocale = "pt-BR";
const compareLocale = "en";

function flattenKeys(value, prefix = "") {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }
  const keys = [];
  for (const key of Object.keys(value)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    keys.push(...flattenKeys(value[key], nextPrefix));
  }
  return keys;
}

async function readNamespace(locale, namespace) {
  const filePath = join(localesDir, locale, namespace);
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function listNamespaces(locale) {
  const localeDir = join(localesDir, locale);
  const entries = await readdir(localeDir);
  return entries.filter((entry) => entry.endsWith(".json")).sort();
}

function diff(a, b) {
  const setB = new Set(b);
  return a.filter((key) => !setB.has(key));
}

async function main() {
  const baseNamespaces = await listNamespaces(baseLocale);
  const compareNamespaces = await listNamespaces(compareLocale);

  const namespaceErrors = [];
  const baseSet = new Set(baseNamespaces);
  const compareSet = new Set(compareNamespaces);

  for (const namespace of baseNamespaces) {
    if (!compareSet.has(namespace)) {
      namespaceErrors.push(
        `[${compareLocale}] falta o namespace ${namespace}`,
      );
    }
  }
  for (const namespace of compareNamespaces) {
    if (!baseSet.has(namespace)) {
      namespaceErrors.push(`[${baseLocale}] falta o namespace ${namespace}`);
    }
  }

  const keyErrors = [];
  const sharedNamespaces = baseNamespaces.filter((ns) => compareSet.has(ns));

  for (const namespace of sharedNamespaces) {
    const baseContent = await readNamespace(baseLocale, namespace);
    const compareContent = await readNamespace(compareLocale, namespace);

    const baseKeys = flattenKeys(baseContent).sort();
    const compareKeys = flattenKeys(compareContent).sort();

    const missingInCompare = diff(baseKeys, compareKeys);
    const missingInBase = diff(compareKeys, baseKeys);

    if (missingInCompare.length > 0) {
      keyErrors.push(
        `[${compareLocale}/${namespace}] chaves faltando: ${missingInCompare.join(", ")}`,
      );
    }
    if (missingInBase.length > 0) {
      keyErrors.push(
        `[${baseLocale}/${namespace}] chaves faltando: ${missingInBase.join(", ")}`,
      );
    }
  }

  const allErrors = [...namespaceErrors, ...keyErrors];

  if (allErrors.length > 0) {
    console.error("Paridade de i18n falhou:");
    for (const error of allErrors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  console.log(
    `Paridade ok: ${sharedNamespaces.length} namespaces validados entre ${baseLocale} e ${compareLocale}.`,
  );
}

main().catch((error) => {
  console.error("Erro inesperado ao validar i18n:", error);
  process.exit(1);
});
