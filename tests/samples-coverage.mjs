// Verifica se os samples cobrem todos os campos do motor.
import { readFileSync, readdirSync } from 'node:fs';
import { normalizeOrgMetadata, evaluateOrgForProcess } from '../allocation-engine.mjs';

const engineSrc = readFileSync(new URL('../allocation-engine.mjs', import.meta.url), 'utf8');
const normalizeReturn = engineSrc.slice(
  engineSrc.indexOf('return {\n', engineSrc.indexOf('normalizeOrgMetadata')),
  engineSrc.indexOf('_raw: raw', engineSrc.indexOf('normalizeOrgMetadata'))
);
const orgFields = new Set();
let m;
const re = /^\s{4}([A-Za-z0-9_]+):\s/gm;
while ((m = re.exec(normalizeReturn)) != null) orgFields.add(m[1]);

const displayOnly = new Set(['orgName','orgType','edition','dataControllerLGPD','lobOwner','podRegion','locale','sharedCustomerBases','isMultiCurrency','eventMonitoringEnabled','apexGuruLastRun']);
// Derivados no próprio motor a partir de outros campos — não devem estar no input.
const derived = new Set(['apexGuruAvailable']);
const requiredForFilters = [...orgFields].filter(f => !displayOnly.has(f) && !derived.has(f));

const samplesDir = new URL('../samples/', import.meta.url);
// Só os samples canônicos do projeto (arquivos com prefixo "Org")
const files = readdirSync(samplesDir).filter(f => f.endsWith('.json') && f.startsWith('Org'));

console.log(`\n=== Auditoria de ${files.length} samples vs. ${requiredForFilters.length} campos que alimentam filtros ===\n`);

let allOk = true;
for (const file of files) {
  const raw = JSON.parse(readFileSync(new URL(file, samplesDir), 'utf8'));
  const declared = new Set(Object.keys(raw));
  const missing = requiredForFilters.filter(f => !declared.has(f));
  console.log(`${file}: ${declared.size} campos, faltam ${missing.length} para cobertura total.`);
  if (missing.length > 0) {
    console.log('  Faltantes:', missing.join(', '));
    allOk = false;
  }
}

console.log('');
if (!allOk) process.exit(1);
