// Testes dos 4 comportamentos adicionados: score ponderado, cascade cost,
// ecosystem view (analyzeLandscape) e recomendação explícita de nova org.
// Rode com: node tests/advanced-tests.mjs

import { normalizeOrgMetadata, evaluateOrgForProcess, analyzeLandscape } from '../allocation-engine.mjs';

// helpers (reduzidos — mesmo padrão da suite principal)
function goldOrg(overrides = {}) {
  return Object.assign({
    orgName: 'OrgGold', regulator: 'BACEN', dataControllerLGPD: 'Empresa S.A.', lobOwner: 'Vendas',
    releaseSchedule: 'biweekly', orgType: 'production', hasPersonAccount: true, isMultiCurrency: true,
    shieldEnabled: true, dataCloudEnabled: true, agentforceEnabled: true, eventMonitoringEnabled: true,
    fatEnabled: true, experienceCloudEnabled: true, customObjectCount: 500, customFieldCount: 8000,
    apexClassCount: 800, userRoleCount: 500, sharingRuleCount: 80, permSetCount: 60, triggerCount: 40,
    flowCount: 90, storagePct: 30, apiUsagePct: 20, customObjectLimitPct: 17, package2Count: 3,
    modifyAllPermSets: 2, modifyAllUserCount: 6, apexGuruCriticalIssues: 3, apexGuruTrend: 'improving',
    apexGuruLastRun: '2026-06-01',
    publishedContracts: ['AccountCDC'], consumedContracts: ['SanctionsHit'],
    pciInScope: true, soxScope: true, installedPackages: [{ namespace: 'FinServ', name: 'FSC' }],
    installedPackageCount: 1, externalFeeds: ['sanctions','kyc'],
    fullCopySandboxes: 2, partialCopySandboxes: 1, developerSandboxes: 5, lastSandboxRefresh: '2026-06-15',
    backupProvider: 'OwnBackup', backupFrequency: 'daily', rtoHours: 2, rpoHours: 1,
    concurrentApiUsagePct: 20, streamingClientsPct: 15, bulkJobsDailyPct: 10, concurrentApiLimit: 25,
    concurrentLongRunningPct: 20, futureQueuePendingPct: 15, queueableDepthUsed: 1,
    timezone: 'America/Sao_Paulo', locale: 'pt_BR', connectedTenants: ['marketingcloud','auth0'],
    supportTier: 'signature', incidentsLast12mo: 0, uptimePct: 99.95, documentationScore: 85,
    tabCount: 40, layoutCount: 60, recordTypeCount: 20,
    platformEventUsagePct: 25, hvpeEnabled: true, pubSubApiEnabled: true,
    cdcEnabledEntities: ['Account','Contact'],
    platformEventPublishedTypes: [{ name: 'AccountCDC', type: 'cdc' }],
    teamHeadcount: 12, teamUtilizationPct: 55, teamSkills: ['apex','lwc','flow','integration'],
    masterDataOwnerFor: ['Account','Contact'], masterDataConsumerOf: ['Product'],
    interOrgLatencyMsP95: {}, sharingModel: 'private', roleHierarchyDepth: 5,
    availableLicenses: { Salesforce: 50, Platform: 100 }, releaseLeadTimeDays: 12, dataMaskEnabled: true,
    activeLanguages: ['pt_BR','en_US'], fieldHistoryRetentionMonths: 60, bigObjectsEnabled: true,
    consentFramework: 'Individual', finopsObservability: true, sandboxRefreshCoordinated: true,
    vendorContractsExpiring: [], envStrategy: 'canary', storageGrowthPctPerMonth: 1,
    costPerUserMonthly: 150, addonRunCostMonthly: 5000
  }, overrides);
}
function goldProc(overrides = {}) {
  return Object.assign({
    name: 'P', regulator: 'BACEN', dataController: 'SAME', dataModel: 'personAccount', features: [],
    cadence: 'biweekly', estimatedRecordsPerYear: '1000000', estimatedApiCallsDaily: '50000',
    complianceScope: ['pci','sox'], integratesWithOrgs: '', requiresNamespace: '',
    modifiesPackageNamespace: '', externalFeeds: 'sanctions,kyc',
    requiredTenants: 'marketingcloud,auth0', targetTimezone: 'America/Sao_Paulo',
    criticality: 'medium', requiredRtoHours: '24', requiredRpoHours: '24',
    permSetsToClone: '2', triggersToRefactor: '1', flowsToMigrate: '3',
    publishesEvents: '', consumesEvents: '', requiresCdc: '', requiresPubSubApi: 'false',
    requiredHeadcount: '2', requiredSkills: 'apex, lwc', touchesMasterDataEntities: '',
    masterDataRole: '', peakApiPerSec: '5', peakEventsPerSec: '10',
    newUsers: '10', monthlyBudgetUSD: '20000', usesLongRunning: 'false', usesFuture: 'false',
    usesQueueable: 'false', maxInterOrgLatencyMs: '0', requiredSharingModel: '', userLicenseRequired: '',
    requiresDataMasking: 'false', requiredLanguages: '', requiredPackageVersions: {},
    requiredFieldHistoryMonths: '0', requiresBigObjects: 'false', requiresConsentFramework: 'false',
    hasHighConsumption: 'false', requiresCoordinatedSandbox: 'false', dependsOnVendorContracts: '',
    requiresCanaryRelease: 'false'
  }, overrides);
}

let passed = 0, failed = 0;
function ok(name, cond, diag = '') {
  if (cond) { console.log(`  ✓ ${name}`); passed++; }
  else { console.log(`  ✗ ${name}`); if (diag) console.log(`    → ${diag}`); failed++; }
}

// ============================================================
// #2 Score ponderado por criticidade
// ============================================================
console.log('\n== Score ponderado por criticidade ==');
{
  // Uma org com 1 fail (regulator) — mede o quanto o fail dói em cada criticalidade
  const badOrg = normalizeOrgMetadata(goldOrg({ regulator: 'CVM' }), 'x');
  const evalLow = evaluateOrgForProcess(badOrg, goldProc({ criticality: 'low' }), ['OrgGold']);
  const evalMed = evaluateOrgForProcess(badOrg, goldProc({ criticality: 'medium' }), ['OrgGold']);
  const evalHigh = evaluateOrgForProcess(badOrg, goldProc({ criticality: 'high' }), ['OrgGold']);
  const evalCrit = evaluateOrgForProcess(badOrg, goldProc({ criticality: 'critical' }), ['OrgGold']);
  ok('score cru independe de criticidade', evalLow.scoreRaw === evalCrit.scoreRaw,
    `low=${evalLow.scoreRaw} crit=${evalCrit.scoreRaw}`);
  ok('score ponderado low > medium > high > critical (mesmo cenário)',
    evalLow.score > evalMed.score && evalMed.score > evalHigh.score && evalHigh.score > evalCrit.score,
    `low=${evalLow.score} med=${evalMed.score} high=${evalHigh.score} crit=${evalCrit.score}`);
  ok('critical amplifica fail (fail dói 3× no critical)',
    (evalMed.score - evalCrit.score) > 0,
    `diff med->crit=${evalMed.score - evalCrit.score}`);
  ok('criticalityFactor exposto', !!evalCrit.criticalityFactor && evalCrit.criticalityFactor.failMult === 3.0);
}

// ============================================================
// #5 Cascade cost
// ============================================================
console.log('\n== Add-on cascade cost ==');
{
  // Org sem Data Cloud nem Agentforce; processo pede agentforce → dispara chain
  const org = normalizeOrgMetadata(goldOrg({ dataCloudEnabled: false, agentforceEnabled: false }), 'x');
  const ev = evaluateOrgForProcess(org, goldProc({
    features: ['agentforce'], newUsers: '10', monthlyBudgetUSD: '30000'
  }), ['OrgGold']);
  const cost = ev.filters.find(f => f.key === 'runCostRecurring');
  ok('cascade detectado (agentforce puxa dataCloud + einsteinPlatform)',
    cost.cascade && cost.cascade.chain.length >= 2,
    `chain=${JSON.stringify(cost.cascade && cost.cascade.chain.map(c => c.sku))}`);
  ok('cascade adiciona custo mensal > 0', cost.cascade.addedMonthly > 0,
    `addedMonthly=${cost.cascade.addedMonthly}`);
  ok('razão do filtro cita cascade',
    /cascade/i.test(cost.reason),
    `reason=${cost.reason}`);

  // Org que já tem tudo → cascade zerado
  const org2 = normalizeOrgMetadata(goldOrg(), 'x');
  const ev2 = evaluateOrgForProcess(org2, goldProc({
    features: ['agentforce'], newUsers: '10', monthlyBudgetUSD: '30000'
  }), ['OrgGold']);
  const cost2 = ev2.filters.find(f => f.key === 'runCostRecurring');
  ok('org que já tem features não dispara cascade',
    cost2.cascade.addedMonthly === 0,
    `chain=${JSON.stringify(cost2.cascade.chain)}`);
}

// ============================================================
// #1 Ecosystem view — analyzeLandscape
// ============================================================
console.log('\n== Ecosystem view (analyzeLandscape) ==');
{
  // Duas orgs pequenas do mesmo perfil → sugere consolidar
  const orgs = [
    goldOrg({ orgName: 'OrgA', storagePct: 20, apiUsagePct: 15, customObjectLimitPct: 10 }),
    goldOrg({ orgName: 'OrgB', storagePct: 25, apiUsagePct: 20, customObjectLimitPct: 12 })
  ].map(o => normalizeOrgMetadata(o, o.orgName + '.json'));
  const evals = orgs.map(o => evaluateOrgForProcess(o, goldProc(), orgs.map(x => x.orgName)));
  const view = analyzeLandscape(evals, goldProc());
  ok('detecta oportunidade de consolidação (mesmo perfil, capacidades folgadas)',
    view.consolidations.length > 0,
    `consolidations=${JSON.stringify(view.consolidations)}`);
  ok('stats corretos', view.stats.total === 2);

  // Uma org apertada e outra folgada do mesmo perfil → sugere rebalancing
  const orgsRebal = [
    goldOrg({ orgName: 'OrgHeavy', storagePct: 85, platformEventUsagePct: 82 }),
    goldOrg({ orgName: 'OrgLight', storagePct: 20, apiUsagePct: 15, platformEventUsagePct: 10 })
  ].map(o => normalizeOrgMetadata(o, o.orgName + '.json'));
  const evalsR = orgsRebal.map(o => evaluateOrgForProcess(o, goldProc(), orgsRebal.map(x => x.orgName)));
  const viewR = analyzeLandscape(evalsR, goldProc());
  ok('detecta rebalancing (heavy → light do mesmo perfil)',
    viewR.rebalancing.length > 0,
    `rebalancing=${JSON.stringify(viewR.rebalancing)}`);
}

// ============================================================
// #A Nova org como recomendação explícita
// ============================================================
console.log('\n== Nova org como recomendação explícita ==');
{
  // Cenário 1: regulator inédito
  const orgs1 = [goldOrg({ regulator: 'BACEN' })].map(o => normalizeOrgMetadata(o, 'x'));
  const evals1 = orgs1.map(o => evaluateOrgForProcess(o, goldProc({ regulator: 'ANS' }), ['OrgGold']));
  const view1 = analyzeLandscape(evals1, goldProc({ regulator: 'ANS' }));
  ok('regulator inédito → nova org recomendada',
    view1.recommendation === 'new-org' && view1.newOrgRationale.some(r => r.criterion === 'regulator inédito'),
    `recommendation=${view1.recommendation} rationale=${JSON.stringify(view1.newOrgRationale)}`);

  // Cenário 2: data controller distinto
  const orgs2 = [goldOrg()].map(o => normalizeOrgMetadata(o, 'x'));
  const evals2 = orgs2.map(o => evaluateOrgForProcess(o, goldProc({ dataController: 'DIFFERENT' }), ['OrgGold']));
  const view2 = analyzeLandscape(evals2, goldProc({ dataController: 'DIFFERENT' }));
  ok('data controller distinto → nova org recomendada',
    view2.recommendation === 'new-org' && view2.newOrgRationale.some(r => r.criterion === 'data controller distinto'),
    `rationale=${JSON.stringify(view2.newOrgRationale)}`);

  // Cenário 3: personAccount inédito
  const orgs3 = [goldOrg({ hasPersonAccount: false })].map(o => normalizeOrgMetadata(o, 'x'));
  const evals3 = orgs3.map(o => evaluateOrgForProcess(o, goldProc({ dataModel: 'personAccount' }), ['OrgGold']));
  const view3 = analyzeLandscape(evals3, goldProc({ dataModel: 'personAccount' }));
  ok('personAccount inédito → nova org recomendada',
    view3.newOrgRationale.some(r => r.criterion === 'Person Account inédito'),
    `rationale=${JSON.stringify(view3.newOrgRationale)}`);

  // Cenário 4: org compatível existente → recomendação "reuse", não "new-org"
  const orgs4 = [goldOrg()].map(o => normalizeOrgMetadata(o, 'x'));
  const evals4 = orgs4.map(o => evaluateOrgForProcess(o, goldProc(), ['OrgGold']));
  const view4 = analyzeLandscape(evals4, goldProc());
  ok('org compatível → recomenda reuso, não nova org',
    view4.recommendation === 'reuse' && view4.newOrgRationale.length === 0,
    `recommendation=${view4.recommendation}`);
}

console.log('');
console.log(`${passed}/${passed+failed} checks passaram, ${failed} falharam.`);
if (failed > 0) process.exit(1);
