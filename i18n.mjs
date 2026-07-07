// i18n.mjs — dicionário multi-idioma + helpers de resolução.
// Idiomas: pt-BR (padrão), en-US, es-ES.
// Chaves flat com namespacing por ponto: 'q.residency.text', 'filter.regulator.label', etc.

const SUPPORTED = ['pt-BR', 'en-US', 'es-ES'];
const DEFAULT_LANG = 'pt-BR';
const STORAGE_KEY = 'salesforce-org-strategy.lang';

let currentLang = DEFAULT_LANG;

export function getSupportedLangs() { return SUPPORTED.slice(); }
export function getLang() { return currentLang; }

function detectInitialLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
  } catch {}
  try {
    const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (nav.startsWith('pt')) return 'pt-BR';
    if (nav.startsWith('en')) return 'en-US';
    if (nav.startsWith('es')) return 'es-ES';
  } catch {}
  return DEFAULT_LANG;
}

export function setLang(lang) {
  if (!SUPPORTED.includes(lang)) return;
  if (lang === currentLang) return;
  currentLang = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
  try { document.documentElement.setAttribute('lang', lang); } catch {}
  try { document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } })); } catch {}
}

export function initLang() {
  currentLang = detectInitialLang();
  try { document.documentElement.setAttribute('lang', currentLang); } catch {}
  return currentLang;
}

// Lookup: dict[currentLang][key] → fallback dict[DEFAULT_LANG][key] → key literal.
// params: { name: 'X' } → substitui {name} no template.
export function t(key, params) {
  if (key == null) return '';
  const primary = dict[currentLang];
  const fallback = dict[DEFAULT_LANG];
  let raw = (primary && primary[key]) ?? (fallback && fallback[key]);
  if (raw == null) return key; // devolve a chave literal se não achar (facilita debug)
  if (params && typeof raw === 'string') {
    raw = raw.replace(/\{(\w+)\}/g, (m, k) => (params[k] != null ? String(params[k]) : m));
  }
  return raw;
}

// Helper para arrays indexados: tList('q.residency.opt', 'label') → ['...', '...', '...']
// Retorna até encontrar chave inexistente.
export function tList(prefix, suffix) {
  const out = [];
  for (let i = 0; i < 32; i++) {
    const key = suffix ? `${prefix}.${i}.${suffix}` : `${prefix}.${i}`;
    const primary = dict[currentLang];
    const fallback = dict[DEFAULT_LANG];
    const raw = (primary && primary[key]) ?? (fallback && fallback[key]);
    if (raw == null) break;
    out.push(raw);
  }
  return out;
}

// ============================================================
// Dicionários — pt-BR completo; en-US e es-ES adicionados na Etapa 4.
// ============================================================

const dict = {
  'pt-BR': {},
  'en-US': {},
  'es-ES': {}
};

// Expõe o dict pra permitir preenchimento externo/incremental sem quebrar o módulo.
export function registerTranslations(lang, entries) {
  if (!SUPPORTED.includes(lang)) return;
  Object.assign(dict[lang], entries);
}
