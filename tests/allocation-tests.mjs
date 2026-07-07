// Suite completa de testes do motor de allocation.
// Rode com: node tests/allocation-tests.mjs
// Convenção: cada filtro tem cenários pass, warn, fail explícitos.

import { normalizeOrgMetadata, evaluateOrgForProcess } from '../allocation-engine.mjs';

function getFilter(result, key) {
  return result.filters.find(f => f.key === key);
}

// Helper: org "gold" que passa em TUDO. Uso base — sobrescrevo o campo do cenário.
function goldOrg(overrides = {}) {
  return Object.assign({
    orgName: 'OrgGold',
    regulator: 'BACEN',
    dataControllerLGPD: 'Banco S.A.',
    lobOwner: 'Varejo PF',
    releaseSchedule: 'biweekly',
    orgType: 'production',
    hasPersonAccount: true,
    isMultiCurrency: true,
    shieldEnabled: true,
    dataCloudEnabled: true,
    agentforceEnabled: true,
    eventMonitoringEnabled: true,
    fatEnabled: true,
    experienceCloudEnabled: true,
    customObjectCount: 500,
    customFieldCount: 8000,
    apexClassCount: 800,
    userRoleCount: 500,
    sharingRuleCount: 80,
    territoryModelCount: 0,
    permSetCount: 60,
    triggerCount: 40,
    flowCount: 90,
    modifyAllPermSets: 2,
    modifyAllUserCount: 6,
    backupFrequency: 'daily',
    concurrentApiLimit: 25,
    storagePct: 30,
    apiUsagePct: 20,
    customObjectLimitPct: 17,
    package2Count: 3,
    apexGuruCriticalIssues: 3,
    apexGuruTrend: 'improving',
    apexGuruLastRun: '2026-06-01',
    publishedContracts: ['AccountCDC','CustomerEvent'],
    consumedContracts: ['ExternalSanctions'],
    pciInScope: true,
    soxScope: true,
    installedPackages: [{ namespace: 'FinServ', name: 'FSC' }],
    installedPackageCount: 1,
    externalFeeds: ['sanctions','kyc','creditbureau'],
    fullCopySandboxes: 2,
    partialCopySandboxes: 1,
    developerSandboxes: 5,
    lastSandboxRefresh: '2026-06-15',
    backupProvider: 'OwnBackup',
    backupFrequency: 'daily',
    rtoHours: 2,
    rpoHours: 1,
    concurrentApiUsagePct: 20,
    streamingClientsPct: 15,
    bulkJobsDailyPct: 10,
    timezone: 'America/Sao_Paulo',
    locale: 'pt_BR',
    connectedTenants: ['marketingcloud','auth0','sap'],
    supportTier: 'signature',
    incidentsLast12mo: 0,
    uptimePct: 99.95,
    documentationScore: 85,
    tabCount: 40,
    layoutCount: 60,
    recordTypeCount: 20,
    platformEventUsagePct: 25,
    hvpeEnabled: true,
    pubSubApiEnabled: true,
    cdcEnabledEntities: ['Account','Contact'],
    platformEventPublishedTypes: [
      { name: 'AccountCDC', type: 'cdc' },
      { name: 'SanctionsHit', type: 'high-volume' }
    ],
    teamHeadcount: 12,
    teamUtilizationPct: 55,
    teamSkills: ['apex','lwc','flow','integration'],
    masterDataOwnerFor: ['Account','Contact'],
    masterDataConsumerOf: ['Product'],
    concurrentLongRunningPct: 20,
    futureQueuePendingPct: 15,
    queueableDepthUsed: 1,
    interOrgLatencyMsP95: {},
    podRegion: 'BR-SP',
    sharingModel: 'private',
    roleHierarchyDepth: 5,
    availableLicenses: { 'Salesforce': 50, 'Platform': 100, 'ExperienceCloud': 200 },
    releaseLeadTimeDays: 12,
    dataMaskEnabled: true,
    activeLanguages: ['pt_BR','en_US'],
    fieldHistoryRetentionMonths: 60,
    bigObjectsEnabled: true,
    consentFramework: 'Individual',
    finopsObservability: true,
    sandboxRefreshCoordinated: true,
    vendorContractsExpiring: [],
    envStrategy: 'canary',
    storageGrowthPctPerMonth: 1,
    costPerUserMonthly: 150,
    addonRunCostMonthly: 5000
  }, overrides);
}

// Helper: proc "gold" que passa em TUDO na OrgGold.
function goldProc(overrides = {}) {
  return Object.assign({
    name: 'ProcessoTeste',
    regulator: 'BACEN',
    dataController: 'SAME',
    dataModel: 'personAccount',
    features: [],
    cadence: 'biweekly',
    estimatedRecordsPerYear: '1000000',
    estimatedApiCallsDaily: '50000',
    complianceScope: ['pci','sox'],
    integratesWithOrgs: '',
    requiresNamespace: '',
    modifiesPackageNamespace: '',
    externalFeeds: 'sanctions,kyc',
    requiredTenants: 'marketingcloud,auth0',
    targetTimezone: 'America/Sao_Paulo',
    criticality: 'medium',
    requiredRtoHours: '24',
    requiredRpoHours: '24',
    permSetsToClone: '2',
    triggersToRefactor: '1',
    flowsToMigrate: '3',
    publishesEvents: '',
    consumesEvents: '',
    requiresCdc: '',
    requiresPubSubApi: 'false',
    requiredHeadcount: '2',
    requiredSkills: 'apex, lwc',
    touchesMasterDataEntities: '',
    masterDataRole: '',
    peakApiPerSec: '5',
    peakEventsPerSec: '10',
    newUsers: '10',
    monthlyBudgetUSD: '20000',
    usesLongRunning: 'false',
    usesFuture: 'false',
    usesQueueable: 'false',
    maxInterOrgLatencyMs: '0',
    requiredSharingModel: '',
    userLicenseRequired: '',
    requiresDataMasking: 'false',
    requiredLanguages: '',
    requiredPackageVersions: {},
    requiredFieldHistoryMonths: '0',
    requiresBigObjects: 'false',
    requiresConsentFramework: 'false',
    hasHighConsumption: 'false',
    requiresCoordinatedSandbox: 'false',
    dependsOnVendorContracts: '',
    requiresCanaryRelease: 'false',
    // Data de referência fixa para o filtro sandbox (staleRefresh) ser determinístico.
    evaluationDate: '2026-07-06'
  }, overrides);
}

const scenarios = [];

// ============================================================
// BASELINE — org gold + proc gold → tudo pass
// ============================================================
scenarios.push({
  name: 'BASELINE — org gold + proc gold → overall pass',
  orgs: [goldOrg()], process: goldProc(), target: 'OrgGold',
  expect: { overall: 'pass' }
});

// ============================================================
// FILTRO 1: regulator (pass/warn/fail)
// ============================================================
scenarios.push({
  name: 'regulator PASS — mesmo regulador',
  orgs: [goldOrg()], process: goldProc({ regulator: 'BACEN' }), target: 'OrgGold',
  expect: { filterKey: 'regulator', status: 'pass' }
});
scenarios.push({
  name: 'regulator WARN — org sem regulador declarado',
  orgs: [goldOrg({ regulator: null })], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'regulator', status: 'warn' }
});
scenarios.push({
  name: 'regulator FAIL — reguladores incompatíveis',
  orgs: [goldOrg({ regulator: 'CVM' })], process: goldProc({ regulator: 'BACEN' }), target: 'OrgGold',
  expect: { filterKey: 'regulator', status: 'fail' }
});
scenarios.push({
  name: 'regulator PASS — processo sem regulador (NONE)',
  orgs: [goldOrg({ regulator: 'BACEN' })], process: goldProc({ regulator: 'NONE' }), target: 'OrgGold',
  expect: { filterKey: 'regulator', status: 'pass' }
});
scenarios.push({
  name: 'regulator PASS — processo sem regulador (vazio) não falha contra org regulada',
  orgs: [goldOrg({ regulator: 'BACEN' })], process: goldProc({ regulator: '' }), target: 'OrgGold',
  expect: { filterKey: 'regulator', status: 'pass' }
});

// ============================================================
// FILTRO 2: dataController (pass/warn/fail)
// ============================================================
scenarios.push({
  name: 'dataController PASS — SAME',
  orgs: [goldOrg()], process: goldProc({ dataController: 'SAME' }), target: 'OrgGold',
  expect: { filterKey: 'dataController', status: 'pass' }
});
scenarios.push({
  name: 'dataController WARN — UNKNOWN',
  orgs: [goldOrg()], process: goldProc({ dataController: 'UNKNOWN' }), target: 'OrgGold',
  expect: { filterKey: 'dataController', status: 'warn' }
});
scenarios.push({
  name: 'dataController FAIL — DIFFERENT',
  orgs: [goldOrg()], process: goldProc({ dataController: 'DIFFERENT' }), target: 'OrgGold',
  expect: { filterKey: 'dataController', status: 'fail' }
});

// ============================================================
// FILTRO 3: dataModel (pass/warn/fail)
// ============================================================
scenarios.push({
  name: 'dataModel PASS — personAccount OK',
  orgs: [goldOrg({ hasPersonAccount: true })], process: goldProc({ dataModel: 'personAccount' }), target: 'OrgGold',
  expect: { filterKey: 'dataModel', status: 'pass' }
});
scenarios.push({
  name: 'dataModel WARN — B2B em org com PersonAccount',
  orgs: [goldOrg({ hasPersonAccount: true })], process: goldProc({ dataModel: 'b2b' }), target: 'OrgGold',
  expect: { filterKey: 'dataModel', status: 'warn' }
});
scenarios.push({
  name: 'dataModel FAIL — personAccount exigido mas org não tem',
  orgs: [goldOrg({ hasPersonAccount: false })], process: goldProc({ dataModel: 'personAccount' }), target: 'OrgGold',
  expect: { filterKey: 'dataModel', status: 'fail' }
});

// ============================================================
// FILTRO 4: features (pass/warn/fail)
// ============================================================
scenarios.push({
  name: 'features PASS — todas ativas',
  orgs: [goldOrg()], process: goldProc({ features: ['shield','fat'] }), target: 'OrgGold',
  expect: { filterKey: 'features', status: 'pass' }
});
scenarios.push({
  name: 'features WARN — Shield não ativo',
  orgs: [goldOrg({ shieldEnabled: false })], process: goldProc({ features: ['shield'] }), target: 'OrgGold',
  expect: { filterKey: 'features', status: 'warn' }
});
scenarios.push({
  name: 'features FAIL — Multi-Currency exigido, não ativo (irreversível)',
  orgs: [goldOrg({ isMultiCurrency: false })], process: goldProc({ features: ['multiCurrency'] }), target: 'OrgGold',
  expect: { filterKey: 'features', status: 'fail' }
});

// ============================================================
// FILTRO 5: capacity (pass/warn/fail)
// ============================================================
scenarios.push({
  name: 'capacity PASS — folga confortável',
  orgs: [goldOrg({ storagePct: 30, apiUsagePct: 20, customObjectLimitPct: 15 })], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'capacity', status: 'pass' }
});
scenarios.push({
  name: 'capacity WARN — apertado',
  orgs: [goldOrg({ storagePct: 75 })], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'capacity', status: 'warn' }
});
scenarios.push({
  name: 'capacity FAIL — crítico',
  orgs: [goldOrg({ storagePct: 90 })], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'capacity', status: 'fail' }
});
scenarios.push({
  name: 'capacity WARN — nenhuma métrica medida (não é 0% saudável)',
  orgs: [goldOrg({ storagePct: null, apiUsagePct: null, customObjectLimitPct: null, customObjectCount: 0 })], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'capacity', status: 'warn' }
});
scenarios.push({
  name: 'capacity PASS — 0% real medido (distinto de ausente)',
  orgs: [goldOrg({ storagePct: 0, apiUsagePct: 0, customObjectLimitPct: 0, customObjectCount: 0 })], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'capacity', status: 'pass' }
});
scenarios.push({
  // Medição parcial: só storage medido (alto) → usa a métrica disponível, não é mascarado por null.
  name: 'capacity WARN — medição parcial (só storage medido, apertado)',
  orgs: [goldOrg({ storagePct: 80, apiUsagePct: null, customObjectLimitPct: null, customObjectCount: 0 })], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'capacity', status: 'warn' }
});
scenarios.push({
  name: 'capacity PASS — medição parcial (só API medida, folgada)',
  orgs: [goldOrg({ storagePct: null, apiUsagePct: 10, customObjectLimitPct: null, customObjectCount: 0 })], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'capacity', status: 'pass' }
});

// ============================================================
// FILTRO 6: health / ApexGuru (pass/warn/fail)
// ============================================================
scenarios.push({
  name: 'health PASS — saúde confortável',
  orgs: [goldOrg({ apexGuruCriticalIssues: 3, apexGuruTrend: 'improving' })], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'health', status: 'pass' }
});
scenarios.push({
  name: 'health WARN — 10 issues críticos',
  orgs: [goldOrg({ apexGuruCriticalIssues: 12 })], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'health', status: 'warn' }
});
scenarios.push({
  name: 'health FAIL — trend degrading',
  orgs: [goldOrg({ apexGuruTrend: 'degrading' })], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'health', status: 'fail' }
});

// ============================================================
// FILTRO 7: cadence (pass/warn/fail)
// ============================================================
scenarios.push({
  name: 'cadence PASS — biweekly cabe em biweekly',
  orgs: [goldOrg({ releaseSchedule: 'biweekly' })], process: goldProc({ cadence: 'biweekly' }), target: 'OrgGold',
  expect: { filterKey: 'cadence', status: 'pass' }
});
scenarios.push({
  name: 'cadence WARN — weekly em monthly mas org tem 2GP',
  orgs: [goldOrg({ releaseSchedule: 'monthly', package2Count: 5 })], process: goldProc({ cadence: 'weekly' }), target: 'OrgGold',
  expect: { filterKey: 'cadence', status: 'warn' }
});
scenarios.push({
  name: 'cadence FAIL — weekly em monthly sem 2GP',
  orgs: [goldOrg({ releaseSchedule: 'monthly', package2Count: 0 })], process: goldProc({ cadence: 'weekly' }), target: 'OrgGold',
  expect: { filterKey: 'cadence', status: 'fail' }
});

// ============================================================
// FILTRO 8: integrations (pass/warn/warn — não tem fail intrínseco)
// ============================================================
scenarios.push({
  name: 'integrations PASS — sem integração declarada',
  orgs: [goldOrg()], process: goldProc({ integratesWithOrgs: '' }), target: 'OrgGold',
  expect: { filterKey: 'integrations', status: 'pass' }
});
scenarios.push({
  name: 'integrations WARN — integra com orgs fora do inventário',
  orgs: [goldOrg({ orgName: 'OrgSolo' })], process: goldProc({ integratesWithOrgs: 'OrgFantasma' }), target: 'OrgSolo',
  expect: { filterKey: 'integrations', status: 'warn' }
});
scenarios.push({
  name: 'integrations WARN — integra com org conhecida mas sem contratos',
  orgs: [
    goldOrg({ orgName: 'OrgSemContrato', publishedContracts: [], consumedContracts: [] }),
    goldOrg({ orgName: 'OrgOutra' })
  ],
  process: goldProc({ integratesWithOrgs: 'OrgOutra' }), target: 'OrgSemContrato',
  expect: { filterKey: 'integrations', status: 'warn' }
});

// ============================================================
// FILTRO 9: projection (pass/warn/fail)
// ============================================================
scenarios.push({
  name: 'projection PASS — volume moderado em org folgada',
  orgs: [goldOrg({ storagePct: 30, apiUsagePct: 20 })],
  process: goldProc({ estimatedRecordsPerYear: '2000000', estimatedApiCallsDaily: '100000' }),
  target: 'OrgGold',
  expect: { filterKey: 'projection', status: 'pass' }
});
scenarios.push({
  name: 'projection WARN — sem estimativa (antes era pass, agora deve ser warn)',
  orgs: [goldOrg()],
  process: goldProc({ estimatedRecordsPerYear: '', estimatedApiCallsDaily: '' }),
  target: 'OrgGold',
  expect: { filterKey: 'projection', status: 'warn' }
});
scenarios.push({
  name: 'projection FAIL — volume alto estoura projeção',
  orgs: [goldOrg({ storagePct: 65, apiUsagePct: 50 })],
  process: goldProc({ estimatedRecordsPerYear: '30000000', estimatedApiCallsDaily: '500000' }),
  target: 'OrgGold',
  expect: { filterKey: 'projection', status: 'fail' }
});

// ============================================================
// FILTRO 10: compliance (PCI/SOX) — cobrindo SOX ampliação (fix)
// ============================================================
scenarios.push({
  name: 'compliance PASS — PCI+SOX alinhados',
  orgs: [goldOrg({ pciInScope: true, soxScope: true })],
  process: goldProc({ complianceScope: ['pci','sox'] }),
  target: 'OrgGold',
  expect: { filterKey: 'compliance', status: 'pass' }
});
scenarios.push({
  name: 'compliance WARN — processo NÃO-SOX em org SOX (deve ampliar warn, antes dava pass)',
  orgs: [goldOrg({ pciInScope: false, soxScope: true })],
  process: goldProc({ complianceScope: [] }),
  target: 'OrgGold',
  expect: { filterKey: 'compliance', status: 'warn' }
});
scenarios.push({
  name: 'compliance FAIL — processo PCI em org fora de scope',
  orgs: [goldOrg({ pciInScope: false, soxScope: false })],
  process: goldProc({ complianceScope: ['pci'] }),
  target: 'OrgGold',
  expect: { filterKey: 'compliance', status: 'fail' }
});

// ============================================================
// FILTRO 11: packages / namespace / license
// ============================================================
scenarios.push({
  name: 'packages PASS — sem requisito',
  orgs: [goldOrg({ installedPackages: [{ namespace: 'FinServ', name: 'FSC' }] })],
  process: goldProc({ requiresNamespace: '', modifiesPackageNamespace: '' }),
  target: 'OrgGold',
  expect: { filterKey: 'packages', status: 'pass' }
});
scenarios.push({
  name: 'packages WARN — >250 packages instalados',
  orgs: [goldOrg({ installedPackages: [], installedPackageCount: 280 })],
  process: goldProc(),
  target: 'OrgGold',
  expect: { filterKey: 'packages', status: 'warn' }
});
scenarios.push({
  name: 'packages FAIL — namespace conflita',
  orgs: [goldOrg({ installedPackages: [{ namespace: 'nCino', name: 'nCino Banking' }] })],
  process: goldProc({ requiresNamespace: 'nCino' }),
  target: 'OrgGold',
  expect: { filterKey: 'packages', status: 'fail' }
});
scenarios.push({
  name: 'packages FAIL — modifica package protegido (allowsExtension=false)',
  orgs: [goldOrg({ installedPackages: [{ namespace: 'proto', name: 'ProtectedApp', allowsExtension: false }] })],
  process: goldProc({ modifiesPackageNamespace: 'proto' }),
  target: 'OrgGold',
  expect: { filterKey: 'packages', status: 'fail' }
});
scenarios.push({
  name: 'packages WARN — modifica package OEM (licença restrita)',
  orgs: [goldOrg({ installedPackages: [{ namespace: 'oemApp', name: 'OEM App', licenseType: 'OEM Embedded' }] })],
  process: goldProc({ modifiesPackageNamespace: 'oemApp' }),
  target: 'OrgGold',
  expect: { filterKey: 'packages', status: 'warn' }
});

// ============================================================
// FILTRO 12: sanctions / feeds externos (pass/warn/fail)
// ============================================================
scenarios.push({
  name: 'sanctions PASS — sem exigência',
  orgs: [goldOrg()], process: goldProc({ externalFeeds: '' }), target: 'OrgGold',
  expect: { filterKey: 'sanctions', status: 'pass' }
});
scenarios.push({
  name: 'sanctions WARN — feed parcial (sanctions ok, sepa faltando)',
  orgs: [goldOrg({ externalFeeds: ['sanctions'] })],
  process: goldProc({ externalFeeds: 'sanctions, sepa' }),
  target: 'OrgGold',
  expect: { filterKey: 'sanctions', status: 'warn' }
});
scenarios.push({
  name: 'sanctions FAIL — nenhum feed exigido conectado',
  orgs: [goldOrg({ externalFeeds: [] })],
  process: goldProc({ externalFeeds: 'sanctions, kyc' }),
  target: 'OrgGold',
  expect: { filterKey: 'sanctions', status: 'fail' }
});

// ============================================================
// FILTRO 13: migrationCost (pass/warn/fail)
// ============================================================
scenarios.push({
  name: 'migrationCost PASS — esforço leve',
  orgs: [goldOrg()],
  process: goldProc({ permSetsToClone: '2', triggersToRefactor: '1', flowsToMigrate: '3' }),
  target: 'OrgGold',
  expect: { filterKey: 'migrationCost', status: 'pass' }
});
scenarios.push({
  name: 'migrationCost WARN — sem estimativa',
  orgs: [goldOrg()],
  process: goldProc({ permSetsToClone: '', triggersToRefactor: '', flowsToMigrate: '' }),
  target: 'OrgGold',
  expect: { filterKey: 'migrationCost', status: 'warn' }
});
scenarios.push({
  name: 'migrationCost FAIL — esforço >60 pessoa-dia',
  orgs: [goldOrg()],
  process: goldProc({ permSetsToClone: '20', triggersToRefactor: '30', flowsToMigrate: '20' }),
  target: 'OrgGold',
  expect: { filterKey: 'migrationCost', status: 'fail' }
});

// ============================================================
// FILTRO 14: sandbox (pass/warn/fail)
// ============================================================
scenarios.push({
  name: 'sandbox PASS — sandboxes recentes',
  orgs: [goldOrg({ fullCopySandboxes: 2, lastSandboxRefresh: '2026-06-15' })],
  process: goldProc({ criticality: 'medium' }), target: 'OrgGold',
  expect: { filterKey: 'sandbox', status: 'pass' }
});
scenarios.push({
  name: 'sandbox WARN — sem sandbox declarado',
  orgs: [goldOrg({ fullCopySandboxes: 0, partialCopySandboxes: 0, developerSandboxes: 0, lastSandboxRefresh: null })],
  process: goldProc({ criticality: 'medium' }), target: 'OrgGold',
  expect: { filterKey: 'sandbox', status: 'warn' }
});
scenarios.push({
  name: 'sandbox FAIL — processo crítico e sem Full Copy',
  orgs: [goldOrg({ fullCopySandboxes: 0, partialCopySandboxes: 1, developerSandboxes: 2 })],
  process: goldProc({ criticality: 'critical' }), target: 'OrgGold',
  expect: { filterKey: 'sandbox', status: 'fail' }
});
scenarios.push({
  // Data de refresh inválida não deve gerar "NaN dias" nem passar silenciosamente pelo cálculo.
  name: 'sandbox PASS — data de refresh inválida cai em noRefreshDate (sem NaN)',
  orgs: [goldOrg({ fullCopySandboxes: 2, lastSandboxRefresh: 'not-a-date' })],
  process: goldProc({ criticality: 'medium' }), target: 'OrgGold',
  expect: { filterKey: 'sandbox', status: 'pass', reasonExcludes: 'NaN' }
});

// ============================================================
// FILTRO 15: backupDR (pass/warn/fail)
// ============================================================
scenarios.push({
  name: 'backupDR PASS — RTO/RPO dentro do exigido',
  orgs: [goldOrg({ backupProvider: 'OwnBackup', rtoHours: 2, rpoHours: 1 })],
  process: goldProc({ criticality: 'high', requiredRtoHours: '4', requiredRpoHours: '2' }),
  target: 'OrgGold',
  expect: { filterKey: 'backupDR', status: 'pass' }
});
scenarios.push({
  name: 'backupDR WARN — provider não declarado (proc medium)',
  orgs: [goldOrg({ backupProvider: null })],
  process: goldProc({ criticality: 'medium' }), target: 'OrgGold',
  expect: { filterKey: 'backupDR', status: 'warn' }
});
scenarios.push({
  name: 'backupDR FAIL — RTO da org não atende exigência do processo',
  orgs: [goldOrg({ backupProvider: 'OwnBackup', rtoHours: 24, rpoHours: 12 })],
  process: goldProc({ criticality: 'high', requiredRtoHours: '4', requiredRpoHours: '1' }),
  target: 'OrgGold',
  expect: { filterKey: 'backupDR', status: 'fail' }
});
scenarios.push({
  name: 'backupDR WARN — provider existe mas SLA não medido (critical), não pass silencioso',
  orgs: [goldOrg({ backupProvider: 'OwnBackup', rtoHours: null, rpoHours: null })],
  process: goldProc({ criticality: 'critical' }), target: 'OrgGold',
  expect: { filterKey: 'backupDR', status: 'warn' }
});

// ============================================================
// FILTRO 16: concurrentLimits (pass/warn/fail)
// ============================================================
scenarios.push({
  name: 'concurrentLimits PASS — folga',
  orgs: [goldOrg({ concurrentApiUsagePct: 20, streamingClientsPct: 15, bulkJobsDailyPct: 10 })],
  process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'concurrentLimits', status: 'pass' }
});
scenarios.push({
  name: 'concurrentLimits WARN — apertado (streaming 75%)',
  orgs: [goldOrg({ streamingClientsPct: 75 })], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'concurrentLimits', status: 'warn' }
});
scenarios.push({
  name: 'concurrentLimits FAIL — Bulk 90%',
  orgs: [goldOrg({ bulkJobsDailyPct: 90 })], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'concurrentLimits', status: 'fail' }
});

// ============================================================
// FILTRO 17: timezone (pass/warn/fail)
// ============================================================
scenarios.push({
  name: 'timezone PASS — mesmo timezone',
  orgs: [goldOrg({ timezone: 'America/Sao_Paulo' })],
  process: goldProc({ targetTimezone: 'America/Sao_Paulo' }), target: 'OrgGold',
  expect: { filterKey: 'timezone', status: 'pass' }
});
scenarios.push({
  name: 'timezone WARN — processo multi em org fixa',
  orgs: [goldOrg({ timezone: 'America/Sao_Paulo' })],
  process: goldProc({ targetTimezone: 'multi' }), target: 'OrgGold',
  expect: { filterKey: 'timezone', status: 'warn' }
});
scenarios.push({
  name: 'timezone FAIL — timezones incompatíveis',
  orgs: [goldOrg({ timezone: 'America/Sao_Paulo' })],
  process: goldProc({ targetTimezone: 'Asia/Tokyo' }), target: 'OrgGold',
  expect: { filterKey: 'timezone', status: 'fail' }
});

// ============================================================
// FILTRO 18: externalTenants (pass/warn/fail)
// ============================================================
scenarios.push({
  name: 'externalTenants PASS — todos conectados',
  orgs: [goldOrg({ connectedTenants: ['marketingcloud','auth0','sap'] })],
  process: goldProc({ requiredTenants: 'marketingcloud,auth0' }), target: 'OrgGold',
  expect: { filterKey: 'externalTenants', status: 'pass' }
});
scenarios.push({
  name: 'externalTenants WARN — parcial',
  orgs: [goldOrg({ connectedTenants: ['marketingcloud'] })],
  process: goldProc({ requiredTenants: 'marketingcloud,sap' }), target: 'OrgGold',
  expect: { filterKey: 'externalTenants', status: 'warn' }
});
scenarios.push({
  name: 'externalTenants FAIL — nenhum conectado',
  orgs: [goldOrg({ connectedTenants: [] })],
  process: goldProc({ requiredTenants: 'marketingcloud,sap' }), target: 'OrgGold',
  expect: { filterKey: 'externalTenants', status: 'fail' }
});

// ============================================================
// FILTRO 19: supportTier (pass/warn/fail)
// ============================================================
scenarios.push({
  name: 'supportTier PASS — signature para critical',
  orgs: [goldOrg({ supportTier: 'signature' })],
  process: goldProc({ criticality: 'critical' }), target: 'OrgGold',
  expect: { filterKey: 'supportTier', status: 'pass' }
});
scenarios.push({
  name: 'supportTier WARN — tier não declarado + proc medium',
  orgs: [goldOrg({ supportTier: null })],
  process: goldProc({ criticality: 'medium' }), target: 'OrgGold',
  expect: { filterKey: 'supportTier', status: 'warn' }
});
scenarios.push({
  name: 'supportTier FAIL — standard para critical',
  orgs: [goldOrg({ supportTier: 'standard' })],
  process: goldProc({ criticality: 'critical' }), target: 'OrgGold',
  expect: { filterKey: 'supportTier', status: 'fail' }
});

// ============================================================
// FILTRO 20: incidents (pass/warn/fail)
// ============================================================
scenarios.push({
  name: 'incidents PASS — histórico saudável',
  orgs: [goldOrg({ incidentsLast12mo: 0, uptimePct: 99.95 })],
  process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'incidents', status: 'pass' }
});
scenarios.push({
  name: 'incidents WARN — 3 incidents',
  orgs: [goldOrg({ incidentsLast12mo: 3, uptimePct: 99.7 })],
  process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'incidents', status: 'warn' }
});
scenarios.push({
  name: 'incidents FAIL — 6 incidents',
  orgs: [goldOrg({ incidentsLast12mo: 6, uptimePct: 98.5 })],
  process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'incidents', status: 'fail' }
});

// ============================================================
// FILTRO 21: documentation (pass/warn/fail)
// ============================================================
scenarios.push({
  name: 'documentation PASS — score alto',
  orgs: [goldOrg({ documentationScore: 85 })], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'documentation', status: 'pass' }
});
scenarios.push({
  name: 'documentation WARN — score médio',
  orgs: [goldOrg({ documentationScore: 55 })], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'documentation', status: 'warn' }
});
scenarios.push({
  name: 'documentation FAIL — score baixo',
  orgs: [goldOrg({ documentationScore: 25 })], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'documentation', status: 'fail' }
});

// ============================================================
// FILTRO 22: uxOverhead (pass/warn/fail)
// ============================================================
scenarios.push({
  name: 'uxOverhead PASS — UX saudável',
  orgs: [goldOrg({ tabCount: 40, layoutCount: 60, recordTypeCount: 20 })],
  process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'uxOverhead', status: 'pass' }
});
scenarios.push({
  name: 'uxOverhead WARN — UX pesada',
  orgs: [goldOrg({ tabCount: 120, layoutCount: 220, recordTypeCount: 70 })],
  process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'uxOverhead', status: 'warn' }
});
scenarios.push({
  name: 'uxOverhead FAIL — UX degradada',
  orgs: [goldOrg({ tabCount: 160, layoutCount: 320, recordTypeCount: 110 })],
  process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'uxOverhead', status: 'fail' }
});

// ============================================================
// FILTRO 23: platformEvents (pass/warn/fail — vários eixos)
// ============================================================
scenarios.push({
  name: 'platformEvents PASS — sem uso declarado',
  orgs: [goldOrg()], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'platformEvents', status: 'pass' }
});
scenarios.push({
  name: 'platformEvents PASS — publica e consome dentro do quota',
  orgs: [goldOrg({ platformEventUsagePct: 20, hvpeEnabled: true })],
  process: goldProc({ publishesEvents: 'CustomerLifecycle:5000', consumesEvents: 'AccountCDC' }),
  target: 'OrgGold',
  expect: { filterKey: 'platformEvents', status: 'pass' }
});
scenarios.push({
  name: 'platformEvents WARN — quota ≥70% pós-alocação',
  orgs: [goldOrg({ platformEventUsagePct: 65, hvpeEnabled: true, platformEventDailyLimit: 1000000 })],
  process: goldProc({ publishesEvents: 'PaymentEvent:80000' }),
  target: 'OrgGold',
  expect: { filterKey: 'platformEvents', status: 'warn' }
});
scenarios.push({
  name: 'platformEvents WARN — CDC entity não habilitado',
  orgs: [goldOrg({ cdcEnabledEntities: ['Account'] })],
  process: goldProc({ requiresCdc: 'Account, Contact, Opportunity' }),
  target: 'OrgGold',
  expect: { filterKey: 'platformEvents', status: 'warn' }
});
scenarios.push({
  name: 'platformEvents FAIL — quota pós-alocação ≥90%',
  orgs: [goldOrg({ platformEventUsagePct: 85, hvpeEnabled: true, platformEventDailyLimit: 1000000 })],
  process: goldProc({ publishesEvents: 'MassEvent:150000' }),
  target: 'OrgGold',
  expect: { filterKey: 'platformEvents', status: 'fail' }
});
scenarios.push({
  name: 'platformEvents FAIL — consome PE que a org não publica',
  orgs: [goldOrg({ platformEventPublishedTypes: [{ name: 'AccountCDC', type: 'cdc' }] })],
  process: goldProc({ consumesEvents: 'FraudDetectedEvent, SanctionsHit' }),
  target: 'OrgGold',
  expect: { filterKey: 'platformEvents', status: 'fail' }
});
scenarios.push({
  name: 'platformEvents FAIL — exige Pub/Sub API, org sem endpoint',
  orgs: [goldOrg({ pubSubApiEnabled: false })],
  process: goldProc({ requiresPubSubApi: 'true' }),
  target: 'OrgGold',
  expect: { filterKey: 'platformEvents', status: 'fail' }
});
scenarios.push({
  name: 'platformEvents FAIL — publica >100k/dia sem HVPE',
  orgs: [goldOrg({ hvpeEnabled: false, platformEventUsagePct: 10 })],
  process: goldProc({ publishesEvents: 'BurstEvent:250000' }),
  target: 'OrgGold',
  expect: { filterKey: 'platformEvents', status: 'fail' }
});
scenarios.push({
  name: 'platformEvents PASS — tolera CometD, org sem Pub/Sub OK',
  orgs: [goldOrg({ pubSubApiEnabled: false })],
  process: goldProc({ requiresPubSubApi: 'false', consumesEvents: 'AccountCDC' }),
  target: 'OrgGold',
  expect: { filterKey: 'platformEvents', status: 'pass' }
});

// ============================================================
// FILTRO 24: teamCapacity
// ============================================================
scenarios.push({
  name: 'teamCapacity PASS — time folgado',
  orgs: [goldOrg({ teamHeadcount: 15, teamUtilizationPct: 55, teamSkills: ['apex','lwc','flow'] })],
  process: goldProc({ requiredSkills: 'apex, lwc' }), target: 'OrgGold',
  expect: { filterKey: 'teamCapacity', status: 'pass' }
});
scenarios.push({
  name: 'teamCapacity WARN — 80% util e skill faltando',
  orgs: [goldOrg({ teamUtilizationPct: 78, teamSkills: ['apex'] })],
  process: goldProc({ requiredSkills: 'apex, lwc' }), target: 'OrgGold',
  expect: { filterKey: 'teamCapacity', status: 'warn' }
});
scenarios.push({
  name: 'teamCapacity FAIL — 95% util',
  orgs: [goldOrg({ teamUtilizationPct: 95 })],
  process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'teamCapacity', status: 'fail' }
});

// ============================================================
// FILTRO 25: mdmOwnership
// ============================================================
scenarios.push({
  name: 'mdmOwnership PASS — sem MDM',
  orgs: [goldOrg()], process: goldProc({ touchesMasterDataEntities: '' }), target: 'OrgGold',
  expect: { filterKey: 'mdmOwnership', status: 'pass' }
});
scenarios.push({
  name: 'mdmOwnership WARN — processo declara entidade mas sem papel',
  orgs: [goldOrg()], process: goldProc({ touchesMasterDataEntities: 'Account', masterDataRole: '' }),
  target: 'OrgGold',
  expect: { filterKey: 'mdmOwnership', status: 'warn' }
});
scenarios.push({
  name: 'mdmOwnership FAIL — processo quer ser owner mas org é consumer',
  orgs: [goldOrg({ masterDataOwnerFor: [], masterDataConsumerOf: ['Account'] })],
  process: goldProc({ touchesMasterDataEntities: 'Account', masterDataRole: 'owner' }),
  target: 'OrgGold',
  expect: { filterKey: 'mdmOwnership', status: 'fail' }
});
scenarios.push({
  name: 'mdmOwnership FAIL — consumer numa org que não é consumer',
  orgs: [goldOrg({ masterDataConsumerOf: [] })],
  process: goldProc({ touchesMasterDataEntities: 'Product', masterDataRole: 'consumer' }),
  target: 'OrgGold',
  expect: { filterKey: 'mdmOwnership', status: 'fail' }
});

// ============================================================
// FILTRO 26: peakVsSustained
// ============================================================
scenarios.push({
  name: 'peakVsSustained PASS — picos absorvidos',
  orgs: [goldOrg({ concurrentApiUsagePct: 10, streamingClientsPct: 10 })],
  process: goldProc({ peakApiPerSec: '3', peakEventsPerSec: '5' }), target: 'OrgGold',
  expect: { filterKey: 'peakVsSustained', status: 'pass' }
});
scenarios.push({
  name: 'peakVsSustained WARN — picos não estimados',
  orgs: [goldOrg()], process: goldProc({ peakApiPerSec: '0', peakEventsPerSec: '0' }), target: 'OrgGold',
  expect: { filterKey: 'peakVsSustained', status: 'warn' }
});
scenarios.push({
  name: 'peakVsSustained FAIL — pico projetado ≥90%',
  orgs: [goldOrg({ concurrentApiUsagePct: 55, streamingClientsPct: 50 })],
  process: goldProc({ peakApiPerSec: '50', peakEventsPerSec: '150' }), target: 'OrgGold',
  expect: { filterKey: 'peakVsSustained', status: 'fail' }
});

// ============================================================
// FILTRO 27: featureCombos
// ============================================================
scenarios.push({
  name: 'featureCombos PASS — sem combo declarado',
  orgs: [goldOrg()], process: goldProc({ features: ['shield'] }), target: 'OrgGold',
  expect: { filterKey: 'featureCombos', status: 'pass' }
});
scenarios.push({
  name: 'featureCombos WARN — Data Cloud+Agentforce sem Experience Cloud',
  orgs: [goldOrg({ dataCloudEnabled: true, agentforceEnabled: true, experienceCloudEnabled: false })],
  process: goldProc({ features: ['dataCloud','agentforce'] }), target: 'OrgGold',
  expect: { filterKey: 'featureCombos', status: 'warn' }
});
scenarios.push({
  name: 'featureCombos FAIL — Shield+FAT exigido, apenas Shield ativo',
  orgs: [goldOrg({ shieldEnabled: true, fatEnabled: false })],
  process: goldProc({ features: ['shield','fat'] }), target: 'OrgGold',
  expect: { filterKey: 'featureCombos', status: 'fail' }
});

// ============================================================
// FILTRO 28: runCostRecurring
// ============================================================
scenarios.push({
  name: 'runCostRecurring PASS — dentro do budget',
  orgs: [goldOrg({ costPerUserMonthly: 150, addonRunCostMonthly: 3000 })],
  process: goldProc({ newUsers: '20', monthlyBudgetUSD: '20000' }), target: 'OrgGold',
  expect: { filterKey: 'runCostRecurring', status: 'pass' }
});
scenarios.push({
  name: 'runCostRecurring WARN — sem estimativa',
  orgs: [goldOrg()], process: goldProc({ newUsers: '0', monthlyBudgetUSD: '0' }), target: 'OrgGold',
  expect: { filterKey: 'runCostRecurring', status: 'warn' }
});
scenarios.push({
  name: 'runCostRecurring FAIL — estoura 150% do budget',
  orgs: [goldOrg({ costPerUserMonthly: 500, addonRunCostMonthly: 20000 })],
  process: goldProc({ newUsers: '100', monthlyBudgetUSD: '20000' }), target: 'OrgGold',
  expect: { filterKey: 'runCostRecurring', status: 'fail' }
});
scenarios.push({
  name: 'runCostRecurring WARN — custo/usuário ausente + users novos (não projeta $0)',
  orgs: [goldOrg({ costPerUserMonthly: null })],
  process: goldProc({ newUsers: '50', monthlyBudgetUSD: '20000' }), target: 'OrgGold',
  expect: { filterKey: 'runCostRecurring', status: 'warn' }
});

// ============================================================
// FILTRO 29: sessionConcurrency
// ============================================================
scenarios.push({
  name: 'sessionConcurrency PASS — sem uso',
  orgs: [goldOrg({ concurrentLongRunningPct: 20, futureQueuePendingPct: 15, queueableDepthUsed: 1 })],
  process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'sessionConcurrency', status: 'pass' }
});
scenarios.push({
  name: 'sessionConcurrency WARN — @future queue 65% + processo usa @future',
  orgs: [goldOrg({ futureQueuePendingPct: 65 })],
  process: goldProc({ usesFuture: 'true' }), target: 'OrgGold',
  expect: { filterKey: 'sessionConcurrency', status: 'warn' }
});
scenarios.push({
  name: 'sessionConcurrency FAIL — Queueable depth já em 5',
  orgs: [goldOrg({ queueableDepthUsed: 5 })],
  process: goldProc({ usesQueueable: 'true' }), target: 'OrgGold',
  expect: { filterKey: 'sessionConcurrency', status: 'fail' }
});

// ============================================================
// FILTRO 30: interOrgLatency
// ============================================================
scenarios.push({
  name: 'interOrgLatency PASS — sem exigência',
  orgs: [goldOrg()], process: goldProc({ maxInterOrgLatencyMs: '0' }), target: 'OrgGold',
  expect: { filterKey: 'interOrgLatency', status: 'pass' }
});
scenarios.push({
  name: 'interOrgLatency WARN — latência não medida',
  orgs: [
    goldOrg({ orgName: 'OrgHub', interOrgLatencyMsP95: {} }),
    goldOrg({ orgName: 'OrgSat' })
  ],
  process: goldProc({ integratesWithOrgs: 'OrgSat', maxInterOrgLatencyMs: '5000' }),
  target: 'OrgHub',
  expect: { filterKey: 'interOrgLatency', status: 'warn' }
});
scenarios.push({
  name: 'interOrgLatency FAIL — P95 viola SLA',
  orgs: [
    goldOrg({ orgName: 'OrgHub', interOrgLatencyMsP95: { OrgSat: 8000 } }),
    goldOrg({ orgName: 'OrgSat' })
  ],
  process: goldProc({ integratesWithOrgs: 'OrgSat', maxInterOrgLatencyMs: '5000' }),
  target: 'OrgHub',
  expect: { filterKey: 'interOrgLatency', status: 'fail' }
});

// ============================================================
// FILTRO 31: sharingModelFit
// ============================================================
scenarios.push({
  name: 'sharingModelFit PASS — alinhado',
  orgs: [goldOrg({ sharingModel: 'private', roleHierarchyDepth: 4 })],
  process: goldProc({ requiredSharingModel: 'private' }), target: 'OrgGold',
  expect: { filterKey: 'sharingModelFit', status: 'pass' }
});
scenarios.push({
  name: 'sharingModelFit WARN — private com role depth 10',
  orgs: [goldOrg({ sharingModel: 'private', roleHierarchyDepth: 10 })],
  process: goldProc({ requiredSharingModel: 'private' }), target: 'OrgGold',
  expect: { filterKey: 'sharingModelFit', status: 'warn' }
});
scenarios.push({
  name: 'sharingModelFit FAIL — private vs public',
  orgs: [goldOrg({ sharingModel: 'public' })],
  process: goldProc({ requiredSharingModel: 'private' }), target: 'OrgGold',
  expect: { filterKey: 'sharingModelFit', status: 'fail' }
});

// ============================================================
// FILTRO 32: licenseContention
// ============================================================
scenarios.push({
  name: 'licenseContention PASS — folga de licenças',
  orgs: [goldOrg({ availableLicenses: { 'Salesforce': 200 } })],
  process: goldProc({ userLicenseRequired: 'Salesforce', newUsers: '10' }), target: 'OrgGold',
  expect: { filterKey: 'licenseContention', status: 'pass' }
});
scenarios.push({
  name: 'licenseContention WARN — consome mais de 75%',
  orgs: [goldOrg({ availableLicenses: { 'Salesforce': 10 } })],
  process: goldProc({ userLicenseRequired: 'Salesforce', newUsers: '9' }), target: 'OrgGold',
  expect: { filterKey: 'licenseContention', status: 'warn' }
});
scenarios.push({
  name: 'licenseContention FAIL — deficit',
  orgs: [goldOrg({ availableLicenses: { 'Salesforce': 5 } })],
  process: goldProc({ userLicenseRequired: 'Salesforce', newUsers: '20' }), target: 'OrgGold',
  expect: { filterKey: 'licenseContention', status: 'fail' }
});

// ============================================================
// FILTRO 33: historicalVelocity
// ============================================================
scenarios.push({
  name: 'historicalVelocity PASS — lead-time cabe',
  orgs: [goldOrg({ releaseLeadTimeDays: 10 })],
  process: goldProc({ cadence: 'biweekly' }), target: 'OrgGold',
  expect: { filterKey: 'historicalVelocity', status: 'pass' }
});
scenarios.push({
  name: 'historicalVelocity WARN — lead-time 15 vs 14',
  orgs: [goldOrg({ releaseLeadTimeDays: 15 })],
  process: goldProc({ cadence: 'biweekly' }), target: 'OrgGold',
  expect: { filterKey: 'historicalVelocity', status: 'warn' }
});
scenarios.push({
  name: 'historicalVelocity FAIL — lead-time 30 vs 7',
  orgs: [goldOrg({ releaseLeadTimeDays: 30 })],
  process: goldProc({ cadence: 'weekly' }), target: 'OrgGold',
  expect: { filterKey: 'historicalVelocity', status: 'fail' }
});

// ============================================================
// FILTRO 34: testDataMask
// ============================================================
scenarios.push({
  name: 'testDataMask PASS — não exigido',
  orgs: [goldOrg()], process: goldProc({ requiresDataMasking: 'false' }), target: 'OrgGold',
  expect: { filterKey: 'testDataMask', status: 'pass' }
});
scenarios.push({
  name: 'testDataMask PASS — exigido e habilitado',
  orgs: [goldOrg({ dataMaskEnabled: true })], process: goldProc({ requiresDataMasking: 'true' }), target: 'OrgGold',
  expect: { filterKey: 'testDataMask', status: 'pass' }
});
scenarios.push({
  name: 'testDataMask FAIL — exigido e ausente',
  orgs: [goldOrg({ dataMaskEnabled: false })], process: goldProc({ requiresDataMasking: 'true' }), target: 'OrgGold',
  expect: { filterKey: 'testDataMask', status: 'fail' }
});

// ============================================================
// FILTRO 35: multiLanguage
// ============================================================
scenarios.push({
  name: 'multiLanguage PASS — sem exigência',
  orgs: [goldOrg()], process: goldProc({ requiredLanguages: '' }), target: 'OrgGold',
  expect: { filterKey: 'multiLanguage', status: 'pass' }
});
scenarios.push({
  name: 'multiLanguage WARN — parcial',
  orgs: [goldOrg({ activeLanguages: ['pt_BR'] })], process: goldProc({ requiredLanguages: 'pt_BR, en_US' }), target: 'OrgGold',
  expect: { filterKey: 'multiLanguage', status: 'warn' }
});
scenarios.push({
  name: 'multiLanguage FAIL — nenhum idioma ativo',
  orgs: [goldOrg({ activeLanguages: [] })], process: goldProc({ requiredLanguages: 'es_ES, en_US' }), target: 'OrgGold',
  expect: { filterKey: 'multiLanguage', status: 'fail' }
});

// ============================================================
// FILTRO 36: packageVersion
// ============================================================
scenarios.push({
  name: 'packageVersion PASS — versão suficiente',
  orgs: [goldOrg({ installedPackages: [{ namespace: 'nCino', name: 'nCino', version: '2.5.0' }] })],
  process: goldProc({ requiredPackageVersions: { 'nCino': '2.0.0' } }),
  target: 'OrgGold',
  expect: { filterKey: 'packageVersion', status: 'pass' }
});
scenarios.push({
  name: 'packageVersion WARN — instalado mas versão não declarada',
  orgs: [goldOrg({ installedPackages: [{ namespace: 'nCino', name: 'nCino' }] })],
  process: goldProc({ requiredPackageVersions: { 'nCino': '2.0.0' } }),
  target: 'OrgGold',
  expect: { filterKey: 'packageVersion', status: 'warn' }
});
scenarios.push({
  name: 'packageVersion FAIL — versão abaixo',
  orgs: [goldOrg({ installedPackages: [{ namespace: 'nCino', name: 'nCino', version: '1.9.0' }] })],
  process: goldProc({ requiredPackageVersions: { 'nCino': '2.5.0' } }),
  target: 'OrgGold',
  expect: { filterKey: 'packageVersion', status: 'fail' }
});

// ============================================================
// FILTRO 37: retentionPolicy
// ============================================================
scenarios.push({
  name: 'retentionPolicy PASS — 60 meses cobre 24 exigidos',
  orgs: [goldOrg({ fieldHistoryRetentionMonths: 60, bigObjectsEnabled: true })],
  process: goldProc({ requiredFieldHistoryMonths: '24', requiresBigObjects: 'false' }),
  target: 'OrgGold',
  expect: { filterKey: 'retentionPolicy', status: 'pass' }
});
scenarios.push({
  name: 'retentionPolicy WARN — retenção parcial (12mo tem, 24 exige)',
  orgs: [goldOrg({ fieldHistoryRetentionMonths: 12 })],
  process: goldProc({ requiredFieldHistoryMonths: '24' }), target: 'OrgGold',
  expect: { filterKey: 'retentionPolicy', status: 'warn' }
});
scenarios.push({
  name: 'retentionPolicy FAIL — Big Objects exigidos e ausentes',
  orgs: [goldOrg({ bigObjectsEnabled: false, fieldHistoryRetentionMonths: 0 })],
  process: goldProc({ requiresBigObjects: 'true', requiredFieldHistoryMonths: '84' }), target: 'OrgGold',
  expect: { filterKey: 'retentionPolicy', status: 'fail' }
});

// ============================================================
// FILTRO 38: marketingConsent
// ============================================================
scenarios.push({
  name: 'marketingConsent PASS — não exigido',
  orgs: [goldOrg()], process: goldProc({ requiresConsentFramework: 'false' }), target: 'OrgGold',
  expect: { filterKey: 'marketingConsent', status: 'pass' }
});
scenarios.push({
  name: 'marketingConsent PASS — framework ativo',
  orgs: [goldOrg({ consentFramework: 'Individual' })], process: goldProc({ requiresConsentFramework: 'true' }), target: 'OrgGold',
  expect: { filterKey: 'marketingConsent', status: 'pass' }
});
scenarios.push({
  name: 'marketingConsent FAIL — exigido e ausente',
  orgs: [goldOrg({ consentFramework: null })], process: goldProc({ requiresConsentFramework: 'true' }), target: 'OrgGold',
  expect: { filterKey: 'marketingConsent', status: 'fail' }
});

// ============================================================
// FILTRO 39: finopsObservability
// ============================================================
scenarios.push({
  name: 'finopsObservability PASS — sem alto consumo',
  orgs: [goldOrg({ finopsObservability: false })], process: goldProc({ hasHighConsumption: 'false' }), target: 'OrgGold',
  expect: { filterKey: 'finopsObservability', status: 'pass' }
});
scenarios.push({
  name: 'finopsObservability PASS — alto consumo + observability',
  orgs: [goldOrg({ finopsObservability: true })], process: goldProc({ hasHighConsumption: 'true' }), target: 'OrgGold',
  expect: { filterKey: 'finopsObservability', status: 'pass' }
});
scenarios.push({
  name: 'finopsObservability FAIL — alto consumo sem observability',
  orgs: [goldOrg({ finopsObservability: false })], process: goldProc({ hasHighConsumption: 'true' }), target: 'OrgGold',
  expect: { filterKey: 'finopsObservability', status: 'fail' }
});

// ============================================================
// FILTRO 40: sandboxCoordination
// ============================================================
scenarios.push({
  name: 'sandboxCoordination PASS — não exigido',
  orgs: [goldOrg()], process: goldProc({ requiresCoordinatedSandbox: 'false' }), target: 'OrgGold',
  expect: { filterKey: 'sandboxCoordination', status: 'pass' }
});
scenarios.push({
  name: 'sandboxCoordination PASS — coordenado',
  orgs: [goldOrg({ sandboxRefreshCoordinated: true })], process: goldProc({ requiresCoordinatedSandbox: 'true' }), target: 'OrgGold',
  expect: { filterKey: 'sandboxCoordination', status: 'pass' }
});
scenarios.push({
  name: 'sandboxCoordination FAIL — exigido e não coordenado',
  orgs: [goldOrg({ sandboxRefreshCoordinated: false })], process: goldProc({ requiresCoordinatedSandbox: 'true' }), target: 'OrgGold',
  expect: { filterKey: 'sandboxCoordination', status: 'fail' }
});

// ============================================================
// FILTRO 41: vendorContract
// ============================================================
scenarios.push({
  name: 'vendorContract PASS — sem dependência',
  orgs: [goldOrg()], process: goldProc({ dependsOnVendorContracts: '' }), target: 'OrgGold',
  expect: { filterKey: 'vendorContract', status: 'pass' }
});
scenarios.push({
  name: 'vendorContract WARN — 1 de 2 expirando',
  orgs: [goldOrg({ vendorContractsExpiring: ['nCino'] })],
  process: goldProc({ dependsOnVendorContracts: 'nCino, Auth0' }), target: 'OrgGold',
  expect: { filterKey: 'vendorContract', status: 'warn' }
});
scenarios.push({
  name: 'vendorContract FAIL — todos expirando',
  orgs: [goldOrg({ vendorContractsExpiring: ['nCino','Auth0'] })],
  process: goldProc({ dependsOnVendorContracts: 'nCino, Auth0' }), target: 'OrgGold',
  expect: { filterKey: 'vendorContract', status: 'fail' }
});

// ============================================================
// FILTRO 42: envStrategy
// ============================================================
scenarios.push({
  name: 'envStrategy PASS — sem canary',
  orgs: [goldOrg({ envStrategy: 'prod-only' })], process: goldProc({ requiresCanaryRelease: 'false' }), target: 'OrgGold',
  expect: { filterKey: 'envStrategy', status: 'pass' }
});
scenarios.push({
  name: 'envStrategy WARN — org sem estratégia declarada',
  orgs: [goldOrg({ envStrategy: null })], process: goldProc({ requiresCanaryRelease: 'true' }), target: 'OrgGold',
  expect: { filterKey: 'envStrategy', status: 'warn' }
});
scenarios.push({
  name: 'envStrategy FAIL — canary exigido em org bigbang',
  orgs: [goldOrg({ envStrategy: 'bigbang' })], process: goldProc({ requiresCanaryRelease: 'true' }), target: 'OrgGold',
  expect: { filterKey: 'envStrategy', status: 'fail' }
});

// ============================================================
// FILTRO 43: growthTrend
// ============================================================
scenarios.push({
  name: 'growthTrend PASS — crescimento sustentável',
  orgs: [goldOrg({ storagePct: 30, storageGrowthPctPerMonth: 1 })], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'growthTrend', status: 'pass' }
});
scenarios.push({
  name: 'growthTrend WARN — 12mo projeta 85%+',
  orgs: [goldOrg({ storagePct: 40, storageGrowthPctPerMonth: 4 })], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'growthTrend', status: 'warn' }
});
scenarios.push({
  name: 'growthTrend FAIL — storage estoura em <12mo',
  orgs: [goldOrg({ storagePct: 70, storageGrowthPctPerMonth: 5 })], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'growthTrend', status: 'fail' }
});

// ============================================================
// FILTRO 44: metadataComplexity
// ============================================================
scenarios.push({
  name: 'metadataComplexity PASS — score baixo',
  orgs: [goldOrg()], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'metadataComplexity', status: 'pass' }
});
scenarios.push({
  name: 'metadataComplexity WARN — sinais moderados',
  orgs: [goldOrg({ customFieldCount: 18000, apexClassCount: 1800, sharingRuleCount: 250, flowCount: 250 })],
  process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'metadataComplexity', status: 'warn' }
});
scenarios.push({
  name: 'metadataComplexity FAIL — muitos sinais críticos',
  orgs: [goldOrg({
    customFieldCount: 40000, apexClassCount: 5000, userRoleCount: 8000,
    sharingRuleCount: 600, territoryModelCount: 5,
    permSetCount: 700, triggerCount: 300, flowCount: 700
  })],
  process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'metadataComplexity', status: 'fail' }
});

// ============================================================
// FILTRO 45: adminHygiene
// ============================================================
scenarios.push({
  name: 'adminHygiene PASS — ModifyAllData controlado',
  orgs: [goldOrg({ modifyAllPermSets: 2, modifyAllUserCount: 5 })], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'adminHygiene', status: 'pass' }
});
scenarios.push({
  name: 'adminHygiene WARN — espalhamento moderado',
  orgs: [goldOrg({ modifyAllPermSets: 7, modifyAllUserCount: 20 })], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'adminHygiene', status: 'warn' }
});
scenarios.push({
  name: 'adminHygiene FAIL — ModifyAllData espalhado',
  orgs: [goldOrg({ modifyAllPermSets: 15, modifyAllUserCount: 40 })], process: goldProc(), target: 'OrgGold',
  expect: { filterKey: 'adminHygiene', status: 'fail' }
});

// ========== EXECUTOR ==========
let passed = 0, failed = 0;
const failures = [];

for (const sc of scenarios) {
  const normOrgs = sc.orgs.map(o => normalizeOrgMetadata(o, o.orgName + '.json'));
  const knownNames = normOrgs.map(o => o.orgName);
  const target = normOrgs.find(o => o.orgName === sc.target) || normOrgs[0];
  const result = evaluateOrgForProcess(target, sc.process, knownNames);

  let ok = true;
  let diag = '';
  if (sc.expect.overall && result.overall !== sc.expect.overall) {
    ok = false;
    diag = `overall esperado=${sc.expect.overall}, obtido=${result.overall}`;
  }
  if (sc.expect.filterKey) {
    const f = getFilter(result, sc.expect.filterKey);
    if (!f) { ok = false; diag = `filtro "${sc.expect.filterKey}" não encontrado`; }
    else if (f.status !== sc.expect.status) {
      ok = false;
      diag = `filtro "${sc.expect.filterKey}" esperado=${sc.expect.status}, obtido=${f.status}. Razão: ${f.reason}`;
    }
    else if (sc.expect.reasonExcludes && f.reason && f.reason.includes(sc.expect.reasonExcludes)) {
      ok = false;
      diag = `filtro "${sc.expect.filterKey}" razão não deveria conter "${sc.expect.reasonExcludes}": ${f.reason}`;
    }
  }

  if (ok) {
    console.log(`  ✓ ${sc.name}`);
    passed++;
  } else {
    console.log(`  ✗ ${sc.name}`);
    console.log(`    → ${diag}`);
    failed++;
    failures.push({ name: sc.name, diag, result });
  }
}

console.log('');
console.log(`${passed}/${scenarios.length} cenários passaram, ${failed} falharam.`);
if (failed > 0) {
  console.log('\nFALHAS DETALHADAS:');
  for (const f of failures) {
    console.log(`\n${f.name}`);
    console.log(`  diagnóstico: ${f.diag}`);
    f.result.filters.forEach(fl => console.log(`  ${fl.status.padEnd(4)} · ${fl.key}: ${fl.reason}`));
  }
  process.exit(1);
}
