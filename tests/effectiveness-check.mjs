// Verifica efetividade do filtro platformEvents contra os 3 samples reais.
// Rode com: node tests/effectiveness-check.mjs
// Deve ranquear OrgVarejoPF > OrgAsset > OrgCorporativa para processo PF event-driven.

import { readFileSync } from 'node:fs';
import { normalizeOrgMetadata, evaluateOrgForProcess } from '../allocation-engine.mjs';

const samples = ['OrgVarejoPF.json','OrgAsset.json','OrgCorporativa.json'];
const orgs = samples.map(f => normalizeOrgMetadata(
  JSON.parse(readFileSync(new URL(`../samples/${f}`, import.meta.url), 'utf8')),
  f
));

// Cenário: novo processo PF event-driven em cima de PE existentes.
const proc = {
  name: 'Novo Onboarding PF Instantâneo',
  regulator: 'BACEN',
  dataController: 'SAME',
  lobOwner: 'Varejo PF',
  dataModel: 'personAccount',
  features: ['shield','fat'],
  cadence: 'weekly',
  estimatedRecordsPerYear: '3000000',
  estimatedApiCallsDaily: '80000',
  complianceScope: ['pci','sox'],
  integratesWithOrgs: '',
  requiresNamespace: '',
  modifiesPackageNamespace: '',
  externalFeeds: 'sanctions, kyc, creditbureau',
  requiredTenants: 'auth0, marketingcloud',
  targetTimezone: 'America/Sao_Paulo',
  criticality: 'critical',
  requiredRtoHours: '4',
  requiredRpoHours: '2',
  permSetsToClone: '3',
  triggersToRefactor: '2',
  flowsToMigrate: '5',
  publishesEvents: 'OnboardingCompletedEvent:8000',
  consumesEvents: 'AccountCDC, CustomerLifecycleEvent',
  requiresCdc: 'Account, Contact',
  requiresPubSubApi: 'true',
  // Data de referência fixa p/ filtro sandbox (staleRefresh) ser determinístico.
  evaluationDate: '2026-07-06'
};

const knownNames = orgs.map(o => o.orgName);
const evaluations = orgs.map(o => evaluateOrgForProcess(o, proc, knownNames));

evaluations.sort((a, b) => {
  const rank = { pass: 0, warn: 1, fail: 2 };
  if (rank[a.overall] !== rank[b.overall]) return rank[a.overall] - rank[b.overall];
  return b.score - a.score;
});

console.log('\n=== Ranking allocation ===\n');
for (const ev of evaluations) {
  console.log(`${ev.overall.toUpperCase().padEnd(4)} · score ${ev.score} · ${ev.org.orgName}`);
  const pe = ev.filters.find(f => f.key === 'platformEvents');
  if (pe) console.log(`         platformEvents=${pe.status} — ${pe.reason}`);
  const fails = ev.filters.filter(f => f.status === 'fail').map(f => f.key);
  const warns = ev.filters.filter(f => f.status === 'warn').map(f => f.key);
  if (fails.length) console.log(`         FAIL em: ${fails.join(', ')}`);
  if (warns.length) console.log(`         WARN em: ${warns.join(', ')}`);
  console.log('');
}

// Efetividade esperada:
//  - OrgVarejoPF é a candidata natural (PF, biweekly, PE OK, tem sanctions/kyc/creditbureau).
//  - OrgAsset falha por regulator=CVM, sem personAccount, sem HVPE, sem Pub/Sub, sem sanctions/kyc.
//  - OrgCorporativa falha por dataModel B2B (sem PA), documentação baixa, quota PE alta, UX pesada.

const varejo = evaluations.find(e => e.org.orgName === 'OrgVarejoPF');
const asset = evaluations.find(e => e.org.orgName === 'OrgAsset');
const corp = evaluations.find(e => e.org.orgName === 'OrgCorporativa');

const checks = [
  ['OrgVarejoPF PE deve ser pass ou warn (candidata natural)', ['pass','warn'].includes(varejo.filters.find(f=>f.key==='platformEvents').status)],
  ['OrgAsset deve falhar em platformEvents (sem HVPE, sem PubSubAPI, PE não publicado)', asset.filters.find(f=>f.key==='platformEvents').status === 'fail'],
  ['OrgCorporativa deve dar warn ou fail em platformEvents (quota 82% + acréscimo)', ['warn','fail'].includes(corp.filters.find(f=>f.key==='platformEvents').status)],
  ['OrgAsset deve falhar em regulator (CVM vs BACEN)', asset.filters.find(f=>f.key==='regulator').status === 'fail'],
  ['OrgCorporativa deve falhar em dataModel (B2B vs personAccount)', corp.filters.find(f=>f.key==='dataModel').status === 'fail'],
  ['Ranking: OrgVarejoPF deve ser 1a', evaluations[0].org.orgName === 'OrgVarejoPF']
];

let passCheck = 0, failCheck = 0;
console.log('=== Checks de efetividade ===\n');
for (const [desc, ok] of checks) {
  console.log(`  ${ok ? '✓' : '✗'} ${desc}`);
  if (ok) passCheck++; else failCheck++;
}
console.log(`\n${passCheck}/${checks.length} checks OK.`);
if (failCheck > 0) process.exit(1);
