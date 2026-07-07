// Audita cobertura: cada campo declarado no normalize/form
// deve ser consumido por pelo menos um filtro.
// Rode com: node tests/coverage-check.mjs

import { readFileSync } from 'node:fs';
import { normalizeOrgMetadata, evaluateOrgForProcess } from '../allocation-engine.mjs';

const engineSrc = readFileSync(new URL('../allocation-engine.mjs', import.meta.url), 'utf8');
const htmlSrc = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

// Extrai campos do normalize: pega o retorno grande do objeto — usa a assinatura "field: ".
// Colhe apenas fields declarados no bloco "return { ... _raw: raw };".
const normalizeReturnBlock = engineSrc.slice(
  engineSrc.indexOf('return {\n', engineSrc.indexOf('normalizeOrgMetadata')),
  engineSrc.indexOf('_raw: raw', engineSrc.indexOf('normalizeOrgMetadata'))
);
const orgFieldRe = /^\s{4}([A-Za-z0-9_]+):\s/gm;
const orgFields = new Set();
let m;
while ((m = orgFieldRe.exec(normalizeReturnBlock)) != null) orgFields.add(m[1]);

// Extrai fields de proc: procura chaves de "proc" que o motor usa.
// Regex sobre engineSrc capturando `proc.<field>`.
const procFieldsInEngine = new Set();
const procRe = /\bproc\.([A-Za-z0-9_]+)\b/g;
while ((m = procRe.exec(engineSrc)) != null) procFieldsInEngine.add(m[1]);

// Extrai fields do form (processSections). O form é montado por buildProcessSections(),
// que retorna o array de seções — cada field declara `id: '...'`.
const sectionsMatch = htmlSrc.match(/function buildProcessSections\(\)\s*\{\s*return \[[\s\S]*?\n  \];\s*\n\}/);
const procFieldsInForm = new Set();
if (sectionsMatch) {
  const idRe = /id:\s*'([A-Za-z0-9_]+)'/g;
  while ((m = idRe.exec(sectionsMatch[0])) != null) procFieldsInForm.add(m[1]);
}
if (procFieldsInForm.size === 0) {
  console.error('ERRO: não consegui extrair campos de buildProcessSections() do HTML — o regex de parsing quebrou (refactor?). Corrija coverage-check.mjs antes de confiar no resultado.');
  process.exit(2);
}

// Verifica quais org fields o motor consome via `org.<field>`.
const orgFieldsUsed = new Set();
const orgRe = /\borg\.([A-Za-z0-9_]+)\b/g;
while ((m = orgRe.exec(engineSrc)) != null) orgFieldsUsed.add(m[1]);

// Campos ORG acessados por indireção (via featureMap) ou usados só para display.
const orgAllowlist = new Set([
  // Display-only (aparecem no relatório do HTML)
  'orgName','orgType','edition','dataControllerLGPD','lobOwner','podRegion','locale','sharedCustomerBases',
  // Acessados via featureMap[procFeature][0]
  'isMultiCurrency','eventMonitoringEnabled',
  // Datas exibidas na razão de outros filtros (apexGuruLastRun aparece nas messages)
  'apexGuruLastRun'
]);

console.log('=== Cobertura ORG (campos declarados em normalizeOrgMetadata que o motor NÃO consome) ===\n');
const orgOrphan = [...orgFields].filter(f => !orgFieldsUsed.has(f) && !orgAllowlist.has(f));
if (orgOrphan.length === 0) console.log('  ✓ nenhum órfão');
else orgOrphan.forEach(f => console.log('  ✗ ' + f));

// Fields do PROC exibidos no relatório mas não usados como filtro (identificação).
const procAllowlist = new Set(['name','lobOwner']);

console.log('\n=== Cobertura PROC (campos do form que o motor NÃO consome) ===\n');
const procOrphan = [...procFieldsInForm].filter(f => {
  if (procAllowlist.has(f)) return false;
  if (f === 'requiredPackageVersionsJson') return !procFieldsInEngine.has('requiredPackageVersions');
  return !procFieldsInEngine.has(f);
});
if (procOrphan.length === 0) console.log('  ✓ nenhum órfão');
else procOrphan.forEach(f => console.log('  ✗ ' + f));

console.log('\n=== Cobertura PROC-REVERSO (campos que o motor lê mas não existem no form) ===\n');
const procMissing = [...procFieldsInEngine].filter(f => {
  if (f === 'requiredPackageVersions') return !procFieldsInForm.has('requiredPackageVersionsJson') && !procFieldsInForm.has('requiredPackageVersions');
  return !procFieldsInForm.has(f);
});
// Filtra os que são obviamente internos (estrutura JS ou controle de teste, não campos de form).
// evaluationDate: data de referência injetável do filtro sandbox — default new Date() em produção,
// fixada só por testes p/ determinismo; não é preenchida pelo usuário no form.
const engineInternal = ['length', 'evaluationDate'];
const noisy = procMissing.filter(f => !engineInternal.includes(f));
if (noisy.length === 0) console.log('  ✓ nenhum órfão');
else noisy.forEach(f => console.log('  ✗ ' + f));

const failed = orgOrphan.length + procOrphan.length + noisy.length;
console.log(`\n${failed === 0 ? 'COBERTURA COMPLETA' : failed + ' gaps encontrados'}.`);
if (failed > 0) process.exit(1);
