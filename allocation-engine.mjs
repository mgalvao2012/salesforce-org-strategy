// Motor de avaliação para o Modo Alocação.
// Funções puras, exportadas como ES Module. Sem dependência de DOM ou de estado global.
// Usado tanto pelo HTML (via <script type="module">) quanto pelo test harness (via import).

import { t } from './i18n.mjs';

function compareVersion(a, b) {
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] || 0, nb = pb[i] || 0;
    if (na !== nb) return na - nb;
  }
  return 0;
}

export function normalizeOrgMetadata(raw, filename) {
  const g = (path, def) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), raw) ?? def;
  const num = v => (typeof v === 'number' ? v : (typeof v === 'string' ? parseInt(v, 10) || 0 : 0));
  const str = v => (typeof v === 'string' && v.trim() ? v.trim() : null);
  const arr = v => (Array.isArray(v) ? v : (typeof v === 'string' && v ? v.split(',').map(s => s.trim()).filter(Boolean) : []));
  const derivedDataModel = (() => {
    const declared = str(g('dataModel'));
    if (declared) return declared;
    if (g('hasPersonAccount')) return 'personAccount';
    if (g('features.fsc') || g('features.financialServicesCloud')) return 'fsc';
    return 'b2b';
  })();
  return {
    orgName: g('orgName') || g('org.name') || g('alias') || filename.replace(/\.json$/i, ''),
    orgType: str(g('orgType')) || 'production',
    isMultiCurrency: !!(g('isMultiCurrency') ?? g('organization.IsMultiCurrencyOrganization') ?? g('features.multiCurrency')),
    hasPersonAccount: !!(g('hasPersonAccount') ?? g('features.personAccount') ?? g('personAccountEnabled')),
    customObjectCount: num(g('customObjectCount') ?? g('counts.customObjects') ?? g('metadata.CustomObject')),
    customFieldCount: num(g('customFieldCount') ?? g('counts.customFields') ?? g('metadata.CustomField')),
    apexClassCount: num(g('apexClassCount') ?? g('counts.apexClasses') ?? g('metadata.ApexClass')),
    userRoleCount: num(g('userRoleCount') ?? g('counts.userRoles') ?? g('sharing.roleCount')),
    territoryModelCount: num(g('territoryModelCount') ?? g('sharing.territoryModels')),
    sharingRuleCount: num(g('sharingRuleCount') ?? g('counts.sharingRules') ?? g('sharing.sharingRules')),
    shieldEnabled: !!(g('shieldEnabled') ?? g('addons.shield') ?? g('features.shield')),
    dataCloudEnabled: !!(g('dataCloudEnabled') ?? g('addons.dataCloud') ?? g('features.dataCloud')),
    agentforceEnabled: !!(g('agentforceEnabled') ?? g('addons.agentforce') ?? g('features.agentforce')),
    eventMonitoringEnabled: !!(g('eventMonitoringEnabled') ?? g('addons.eventMonitoring')),
    fatEnabled: !!(g('fatEnabled') ?? g('addons.fieldAuditTrail')),
    experienceCloudEnabled: !!(g('experienceCloudEnabled') ?? g('addons.experienceCloud') ?? g('features.experienceCloud')),
    package2Count: num(g('package2Count') ?? g('counts.package2') ?? g('devops.package2Count')),
    modifyAllPermSets: num(g('modifyAllPermSets') ?? g('security.modifyAllDataPermSets')),
    modifyAllUserCount: num(g('modifyAllUserCount') ?? g('security.modifyAllDataUsers')),
    dataModel: derivedDataModel,
    edition: str(g('edition')) || 'unknown',
    regulator: str(g('regulator')) || null,
    dataControllerLGPD: str(g('dataControllerLGPD')) || str(g('dataController')) || null,
    lobOwner: str(g('lobOwner')) || str(g('lob')) || null,
    releaseSchedule: str(g('releaseSchedule')) || 'unknown',
    storagePct: num(g('storagePct') ?? g('limits.storagePct')),
    apiUsagePct: num(g('apiUsagePct') ?? g('limits.apiUsagePct')),
    customObjectLimitPct: num(g('customObjectLimitPct') ?? g('limits.customObjectPct')),
    sharedCustomerBases: arr(g('sharedCustomerBases')),
    apexGuruCriticalIssues: num(g('apexGuruCriticalIssues') ?? g('apexGuru.criticalIssues')),
    apexGuruSoqlNonSelective: num(g('apexGuruSoqlNonSelective') ?? g('apexGuru.soqlNonSelective')),
    apexGuruLongRunningApex: num(g('apexGuruLongRunningApex') ?? g('apexGuru.longRunningApex')),
    apexGuruGovernorExceptions: num(g('apexGuruGovernorExceptions') ?? g('apexGuru.governorExceptions')),
    apexGuruTrend: str(g('apexGuruTrend') ?? g('apexGuru.trend')) || null,
    apexGuruLastRun: str(g('apexGuruLastRun') ?? g('apexGuru.lastRun')) || null,
    apexGuruTopOffenders: arr(g('apexGuruTopOffenders') ?? g('apexGuru.topOffenders')),
    apexGuruAvailable: g('apexGuruLastRun') != null || g('apexGuru.lastRun') != null || g('apexGuruCriticalIssues') != null,
    publishedContracts: arr(g('publishedContracts') ?? g('integrations.published')),
    consumedContracts: arr(g('consumedContracts') ?? g('integrations.consumed')),
    pciInScope: g('pciInScope') === true || g('compliance.pciInScope') === true,
    soxScope: g('soxScope') === true || g('compliance.soxScope') === true,
    installedPackages: (() => {
      const raw2 = g('installedPackages') ?? g('packages.installed');
      if (Array.isArray(raw2)) {
        return raw2.map(p => typeof p === 'string'
          ? { namespace: p, name: p, licenseType: null, allowsExtension: true, version: null }
          : { namespace: p.namespace || '', name: p.name || p.namespace || '',
              licenseType: p.licenseType || null,
              allowsExtension: p.allowsExtension !== false,
              version: p.version || null });
      }
      return [];
    })(),
    installedPackageCount: num(g('installedPackageCount') ?? g('packages.count')),
    externalFeeds: arr(g('externalFeeds') ?? g('integrations.externalFeeds')),
    fullCopySandboxes: num(g('fullCopySandboxes') ?? g('sandboxes.fullCopy')),
    partialCopySandboxes: num(g('partialCopySandboxes') ?? g('sandboxes.partialCopy')),
    developerSandboxes: num(g('developerSandboxes') ?? g('sandboxes.developer')),
    lastSandboxRefresh: str(g('lastSandboxRefresh') ?? g('sandboxes.lastRefresh')) || null,
    backupProvider: str(g('backupProvider') ?? g('backup.provider')) || null,
    backupFrequency: str(g('backupFrequency') ?? g('backup.frequency')) || null,
    rtoHours: num(g('rtoHours') ?? g('backup.rtoHours')),
    rpoHours: num(g('rpoHours') ?? g('backup.rpoHours')),
    concurrentApiLimit: num(g('concurrentApiLimit') ?? g('limits.concurrentApi')),
    concurrentApiUsagePct: num(g('concurrentApiUsagePct') ?? g('limits.concurrentApiPct')),
    streamingClientsPct: num(g('streamingClientsPct') ?? g('limits.streamingClientsPct')),
    bulkJobsDailyPct: num(g('bulkJobsDailyPct') ?? g('limits.bulkJobsDailyPct')),
    timezone: str(g('timezone') ?? g('locale.timezone')) || null,
    locale: str(g('locale') ?? g('locale.name')) || null,
    connectedTenants: arr(g('connectedTenants') ?? g('integrations.connectedTenants')),
    supportTier: str(g('supportTier') ?? g('support.tier')) || null,
    incidentsLast12mo: num(g('incidentsLast12mo') ?? g('operations.incidentsLast12mo')),
    uptimePct: (typeof g('uptimePct') === 'number' ? g('uptimePct') : (typeof g('operations.uptimePct') === 'number' ? g('operations.uptimePct') : null)),
    documentationScore: (typeof g('documentationScore') === 'number' ? g('documentationScore') : (typeof g('documentation.score') === 'number' ? g('documentation.score') : null)),
    tabCount: num(g('tabCount') ?? g('ux.tabCount')),
    layoutCount: num(g('layoutCount') ?? g('ux.layoutCount')),
    recordTypeCount: num(g('recordTypeCount') ?? g('ux.recordTypeCount')),
    permSetCount: num(g('permSetCount') ?? g('security.permSetCount')),
    triggerCount: num(g('triggerCount') ?? g('metadata.triggerCount')),
    flowCount: num(g('flowCount') ?? g('metadata.flowCount')),
    platformEventUsagePct: num(g('platformEventUsagePct') ?? g('platformEvents.usagePct')),
    platformEventDailyLimit: num(g('platformEventDailyLimit') ?? g('platformEvents.dailyLimit')),
    hvpeEnabled: !!(g('hvpeEnabled') ?? g('platformEvents.hvpeEnabled') ?? g('features.highVolumePlatformEvents')),
    pubSubApiEnabled: !!(g('pubSubApiEnabled') ?? g('platformEvents.pubSubApiEnabled') ?? g('features.pubSubApi')),
    cdcEnabledEntities: arr(g('cdcEnabledEntities') ?? g('platformEvents.cdcEntities')),
    platformEventPublishedTypes: (() => {
      const raw2 = g('platformEventPublishedTypes') ?? g('platformEvents.publishedTypes');
      if (Array.isArray(raw2)) {
        return raw2.map(p => typeof p === 'string'
          ? { name: p, type: 'standard' }
          : { name: p.name || '', type: (p.type || 'standard').toLowerCase() });
      }
      return [];
    })(),
    // Team & bench
    teamHeadcount: num(g('teamHeadcount') ?? g('team.headcount')),
    teamUtilizationPct: num(g('teamUtilizationPct') ?? g('team.utilizationPct')),
    teamSkills: arr(g('teamSkills') ?? g('team.skills')),
    // MDM ownership
    masterDataOwnerFor: arr(g('masterDataOwnerFor') ?? g('mdm.ownerFor')),
    masterDataConsumerOf: arr(g('masterDataConsumerOf') ?? g('mdm.consumerOf')),
    // Concurrency real (session/long-running/queueable)
    concurrentLongRunningPct: num(g('concurrentLongRunningPct') ?? g('limits.concurrentLongRunningPct')),
    futureQueuePendingPct: num(g('futureQueuePendingPct') ?? g('limits.futureQueuePendingPct')),
    queueableDepthUsed: num(g('queueableDepthUsed') ?? g('limits.queueableDepthUsed')),
    // Inter-org latency
    interOrgLatencyMsP95: (() => {
      const raw2 = g('interOrgLatencyMsP95') ?? g('integrations.latencyP95');
      return (raw2 && typeof raw2 === 'object' && !Array.isArray(raw2)) ? raw2 : {};
    })(),
    podRegion: str(g('podRegion') ?? g('locale.pod')) || null,
    // Sharing model
    sharingModel: str(g('sharingModel') ?? g('sharing.model')) || null,
    roleHierarchyDepth: num(g('roleHierarchyDepth') ?? g('sharing.roleDepth')),
    // Licenses on org
    availableLicenses: (() => {
      const raw2 = g('availableLicenses') ?? g('licenses.available');
      if (raw2 && typeof raw2 === 'object' && !Array.isArray(raw2)) return raw2;
      return {};
    })(),
    // Release velocity real
    releaseLeadTimeDays: num(g('releaseLeadTimeDays') ?? g('devops.leadTimeDays')),
    // Test data masking
    dataMaskEnabled: !!(g('dataMaskEnabled') ?? g('sandboxes.dataMaskEnabled')),
    // Languages
    activeLanguages: arr(g('activeLanguages') ?? g('locale.activeLanguages')),
    // Retention
    fieldHistoryRetentionMonths: num(g('fieldHistoryRetentionMonths') ?? g('retention.fieldHistoryMonths')),
    bigObjectsEnabled: !!(g('bigObjectsEnabled') ?? g('retention.bigObjects')),
    // Consent
    consentFramework: str(g('consentFramework') ?? g('consent.framework')) || null,
    // FinOps
    finopsObservability: !!(g('finopsObservability') ?? g('finops.hasObservability')),
    // Sandbox coordination
    sandboxRefreshCoordinated: !!(g('sandboxRefreshCoordinated') ?? g('sandboxes.coordinated')),
    // Vendor contract
    vendorContractsExpiring: arr(g('vendorContractsExpiring') ?? g('contracts.expiring')),
    // Env strategy
    envStrategy: str(g('envStrategy') ?? g('devops.envStrategy')) || null,
    // Growth trend (monthly delta for storage)
    storageGrowthPctPerMonth: (typeof g('storageGrowthPctPerMonth') === 'number' ? g('storageGrowthPctPerMonth') : (typeof g('growth.storagePctPerMonth') === 'number' ? g('growth.storagePctPerMonth') : 0)),
    // Cost per user baseline
    costPerUserMonthly: num(g('costPerUserMonthly') ?? g('cost.perUserMonthly')),
    // Cost of add-ons already on-org
    addonRunCostMonthly: num(g('addonRunCostMonthly') ?? g('cost.addonMonthly')),
    _raw: raw
  };
}

// knownOrgNames é um array com todos os orgName do landscape; usado só para o filtro
// de integrações (saber se as orgs referenciadas pelo processo estão no inventário).
export function evaluateOrgForProcess(org, proc, knownOrgNames = []) {
  const filters = [];

  // Filtro 1: regulador
  const orgRegulator = org.regulator || 'unknown';
  const procRegulator = proc.regulator;
  let regStatus = 'pass', regReason = '';
  if (procRegulator === 'NONE') {
    regStatus = 'pass';
    regReason = t('engine.filter.regulator.notRegulated');
  } else if (orgRegulator === 'unknown') {
    regStatus = 'warn';
    regReason = t('engine.filter.regulator.unknownOrg');
  } else if (orgRegulator === procRegulator) {
    regStatus = 'pass';
    regReason = t('engine.filter.regulator.match', { reg: procRegulator });
  } else {
    regStatus = 'fail';
    regReason = t('engine.filter.regulator.mismatch', { proc: procRegulator, org: orgRegulator });
  }
  filters.push({ key: 'regulator', label: t('engine.filter.regulator.label'), status: regStatus, reason: regReason });

  // Filtro 1b: data controller LGPD
  const dc = proc.dataController;
  let dcStatus = 'pass', dcReason = '';
  if (dc === 'SAME') { dcStatus = 'pass'; dcReason = t('engine.filter.dataController.same'); }
  else if (dc === 'DIFFERENT') { dcStatus = 'fail'; dcReason = t('engine.filter.dataController.different'); }
  else { dcStatus = 'warn'; dcReason = t('engine.filter.dataController.toDefine'); }
  filters.push({ key: 'dataController', label: t('engine.filter.dataController.label'), status: dcStatus, reason: dcReason });

  // Filtro 2: data model
  let dmStatus = 'pass', dmReason = '';
  if (proc.dataModel === 'personAccount') {
    if (org.hasPersonAccount) { dmStatus = 'pass'; dmReason = t('engine.filter.dataModel.personAccount.ok'); }
    else { dmStatus = 'fail'; dmReason = t('engine.filter.dataModel.personAccount.missing'); }
  } else if (proc.dataModel === 'fsc') {
    if (org.dataModel === 'fsc') { dmStatus = 'pass'; dmReason = t('engine.filter.dataModel.fsc.ok'); }
    else { dmStatus = 'fail'; dmReason = t('engine.filter.dataModel.fsc.missing'); }
  } else if (proc.dataModel === 'b2b') {
    if (org.hasPersonAccount) { dmStatus = 'warn'; dmReason = t('engine.filter.dataModel.b2b.warnPersonAccount'); }
    else { dmStatus = 'pass'; dmReason = t('engine.filter.dataModel.b2b.ok'); }
  } else if (['healthcloud','nonprofit','education','manufacturing'].includes(proc.dataModel)) {
    if (org.dataModel === proc.dataModel) { dmStatus = 'pass'; dmReason = t('engine.filter.dataModel.industry.ok', { model: proc.dataModel }); }
    else { dmStatus = 'fail'; dmReason = t('engine.filter.dataModel.industry.missing', { procModel: proc.dataModel, orgModel: org.dataModel || t('engine.filter.dataModel.industry.defaultB2B') }); }
  } else {
    dmStatus = 'warn'; dmReason = t('engine.filter.dataModel.custom');
  }
  filters.push({ key: 'dataModel', label: t('engine.filter.dataModel.label'), status: dmStatus, reason: dmReason });

  // Filtro 2b: features especiais
  const featureMap = {
    multiCurrency: ['isMultiCurrency', 'Multi-Currency'],
    shield: ['shieldEnabled', 'Shield'],
    fat: ['fatEnabled', 'Field Audit Trail'],
    eventMonitoring: ['eventMonitoringEnabled', 'Event Monitoring'],
    dataCloud: ['dataCloudEnabled', 'Data Cloud'],
    agentforce: ['agentforceEnabled', 'Agentforce'],
    experienceCloud: ['experienceCloudEnabled', 'Experience Cloud']
  };
  const missing = (proc.features || []).filter(f => featureMap[f] && !org[featureMap[f][0]]);
  let featStatus, featReason;
  if (missing.length === 0) {
    featStatus = 'pass';
    featReason = (proc.features || []).length ? t('engine.filter.features.allActive') : t('engine.filter.features.noneRequired');
  } else {
    const critical = missing.filter(f => f === 'multiCurrency');
    featStatus = critical.length ? 'fail' : 'warn';
    const suffix = critical.length ? t('engine.filter.features.missing.suffixIrreversible') : t('engine.filter.features.missing.suffixSku');
    featReason = t('engine.filter.features.missing', { list: missing.map(f => featureMap[f][1]).join(', '), suffix });
  }
  filters.push({ key: 'features', label: t('engine.filter.features.label'), status: featStatus, reason: featReason });

  // Filtro 3: capacidade técnica atual
  const objLimitPct = org.customObjectLimitPct || Math.round(org.customObjectCount / 30);
  const storagePct = org.storagePct || 0;
  const apiPct = org.apiUsagePct || 0;
  const maxPct = Math.max(objLimitPct, storagePct, apiPct);
  let capStatus, capReason;
  if (maxPct >= 85) { capStatus = 'fail'; capReason = t('engine.filter.capacity.critical', { max: maxPct, obj: objLimitPct, storage: storagePct, api: apiPct }); }
  else if (maxPct >= 70) { capStatus = 'warn'; capReason = t('engine.filter.capacity.tight', { max: maxPct }); }
  else { capStatus = 'pass'; capReason = t('engine.filter.capacity.ok', { max: maxPct, obj: objLimitPct, storage: storagePct, api: apiPct }); }
  filters.push({ key: 'capacity', label: t('engine.filter.capacity.label'), status: capStatus, reason: capReason });

  // Filtro 3b: saúde operacional (ApexGuru)
  let healthStatus, healthReason;
  if (!org.apexGuruAvailable) {
    healthStatus = 'warn';
    healthReason = t('engine.filter.health.noData');
  } else {
    const crit = org.apexGuruCriticalIssues || 0;
    const soql = org.apexGuruSoqlNonSelective || 0;
    const longApex = org.apexGuruLongRunningApex || 0;
    const govExc = org.apexGuruGovernorExceptions || 0;
    const trend = org.apexGuruTrend;
    const facts = [];
    if (crit) facts.push(t('engine.filter.health.fact.critical', { n: crit }));
    if (soql) facts.push(t('engine.filter.health.fact.soql', { n: soql }));
    if (longApex) facts.push(t('engine.filter.health.fact.longApex', { n: longApex }));
    if (govExc) facts.push(t('engine.filter.health.fact.governor', { n: govExc }));
    const factStr = facts.join(', ') || t('engine.filter.health.fact.none');
    const trendLabel = trend ? t('engine.filter.health.trendLabel', { trend }) : '';
    if (crit > 30 || govExc > 20 || trend === 'degrading') {
      healthStatus = 'fail';
      healthReason = t('engine.filter.health.critical', { facts: factStr, trend: trendLabel });
    } else if (crit >= 10 || soql >= 5 || longApex >= 5 || trend === 'stable-on-debt') {
      healthStatus = 'warn';
      healthReason = t('engine.filter.health.tight', { facts: factStr, trend: trendLabel });
    } else {
      healthStatus = 'pass';
      healthReason = t('engine.filter.health.ok', { facts: factStr, trend: trendLabel });
    }
    if (org.apexGuruTopOffenders && org.apexGuruTopOffenders.length) {
      healthReason += ' ' + t('engine.filter.health.topOffenders', { list: org.apexGuruTopOffenders.slice(0, 5).join(', ') });
    }
  }
  filters.push({ key: 'health', label: t('engine.filter.health.label'), status: healthStatus, reason: healthReason });

  // Filtro 4: cadência
  const cadenceOrder = { weekly: 1, biweekly: 2, monthly: 3, quarterly: 4 };
  const procCad = cadenceOrder[proc.cadence] || 3;
  const orgCad = cadenceOrder[org.releaseSchedule] || 999;
  let cadStatus, cadReason;
  if (org.releaseSchedule === 'unknown') {
    cadStatus = 'warn'; cadReason = t('engine.filter.cadence.unknown');
  } else if (procCad >= orgCad) {
    cadStatus = 'pass'; cadReason = t('engine.filter.cadence.fits', { proc: proc.cadence, org: org.releaseSchedule });
  } else if (org.package2Count > 0) {
    cadStatus = 'warn'; cadReason = t('engine.filter.cadence.warn2gp', { proc: proc.cadence, org: org.releaseSchedule, pkg: org.package2Count });
  } else {
    cadStatus = 'fail'; cadReason = t('engine.filter.cadence.mismatch', { proc: proc.cadence, org: org.releaseSchedule });
  }
  filters.push({ key: 'cadence', label: t('engine.filter.cadence.label'), status: cadStatus, reason: cadReason });

  // Filtro 5: Integrações inter-org
  const procIntegrates = (proc.integratesWithOrgs || '').split(',').map(s => s.trim()).filter(Boolean);
  let intStatus = 'pass', intReason = t('engine.filter.integrations.none');
  if (procIntegrates.length > 0) {
    const known = new Set(knownOrgNames);
    const missingOrgs = procIntegrates.filter(n => !known.has(n));
    const consumed = new Set(org.consumedContracts || []);
    const published = new Set(org.publishedContracts || []);
    if (missingOrgs.length === procIntegrates.length) {
      intStatus = 'warn';
      intReason = t('engine.filter.integrations.notInInventory', { list: procIntegrates.join(', ') });
    } else if (published.size === 0 && consumed.size === 0) {
      intStatus = 'warn';
      intReason = t('engine.filter.integrations.noContracts', { list: procIntegrates.join(', ') });
    } else {
      const impacted = procIntegrates.filter(n => known.has(n));
      intStatus = 'pass';
      intReason = t('engine.filter.integrations.ok', { list: impacted.join(', '), published: published.size, consumed: consumed.size });
    }
  }
  filters.push({ key: 'integrations', label: t('engine.filter.integrations.label'), status: intStatus, reason: intReason });

  // Filtro 6: Projeção de volume pós-alocação
  const numParse = v => (typeof v === 'string' ? parseInt(v.replace(/[.,\s_]/g, ''), 10) || 0 : (typeof v === 'number' ? v : 0));
  const procRecords = numParse(proc.estimatedRecordsPerYear);
  const procApiDaily = numParse(proc.estimatedApiCallsDaily);
  let projStatus, projReason;
  if (procRecords === 0 && procApiDaily === 0) {
    projStatus = 'warn';
    projReason = t('engine.filter.projection.noEstimate');
  } else {
    const storageAdd = Math.round(procRecords / 1000000);
    const apiAddPct = Math.round((procApiDaily / 5000000) * 100);
    const projStorage = (org.storagePct || 0) + storageAdd;
    const projApi = (org.apiUsagePct || 0) + apiAddPct;
    const maxProj = Math.max(projStorage, projApi);
    if (maxProj >= 90) {
      projStatus = 'fail';
      projReason = t('engine.filter.projection.overflow', { storage: projStorage, storageAdd, api: projApi, apiAdd: apiAddPct });
    } else if (maxProj >= 75) {
      projStatus = 'warn';
      projReason = t('engine.filter.projection.tight', { storage: projStorage, api: projApi });
    } else {
      projStatus = 'pass';
      projReason = t('engine.filter.projection.ok', { storage: projStorage, storageAdd, api: projApi, apiAdd: apiAddPct });
    }
  }
  filters.push({ key: 'projection', label: t('engine.filter.projection.label'), status: projStatus, reason: projReason });

  // Filtro 7: PCI-DSS + SOX
  const procPci = (proc.complianceScope || []).includes('pci');
  const procSox = (proc.complianceScope || []).includes('sox');
  let compStatus = 'pass', compReason = t('engine.filter.compliance.none');
  if (procPci || procSox || org.pciInScope || org.soxScope) {
    const orgPci = !!org.pciInScope;
    const orgSox = !!org.soxScope;
    const issues = [];
    const failMarkers = [];
    const warnMarkers = [];
    if (procPci && !orgPci) { issues.push(t('engine.filter.compliance.issue.procPciOnly')); failMarkers.push(true); }
    if (!procPci && orgPci) { issues.push(t('engine.filter.compliance.issue.orgPciOnly')); warnMarkers.push(true); }
    if (procSox && !orgSox) { issues.push(t('engine.filter.compliance.issue.procSoxOnly')); failMarkers.push(true); }
    if (!procSox && orgSox) { issues.push(t('engine.filter.compliance.issue.orgSoxOnly')); warnMarkers.push(true); }
    if (issues.length === 0) {
      compStatus = 'pass';
      const pciStatus = orgPci ? t('engine.filter.compliance.aligned.pciBothIn') : t('engine.filter.compliance.aligned.pciBothOut');
      const soxPart = procSox && orgSox ? t('engine.filter.compliance.aligned.soxSuffix') : '';
      compReason = t('engine.filter.compliance.aligned', { pci: pciStatus, sox: soxPart });
    } else if (failMarkers.length > 0) {
      compStatus = 'fail';
      compReason = issues.join(' · ');
    } else {
      compStatus = 'warn';
      compReason = issues.join(' · ');
    }
  }
  filters.push({ key: 'compliance', label: t('engine.filter.compliance.label'), status: compStatus, reason: compReason });

  // Filtro 8: Managed packages / namespace / licença
  const procNs = (proc.requiresNamespace || '').trim();
  const procModifiesPackage = (proc.modifiesPackageNamespace || '').trim();
  let pkgStatus = 'pass', pkgReason = t('engine.filter.packages.none');
  const installed = org.installedPackages || [];
  const totalPkg = Math.max(installed.length, org.installedPackageCount || 0);
  if (procNs) {
    const conflict = installed.find(p => p.namespace === procNs);
    if (conflict) {
      pkgStatus = 'fail';
      pkgReason = t('engine.filter.packages.namespaceConflict', { ns: procNs, name: conflict.name });
    } else {
      pkgStatus = 'pass';
      pkgReason = t('engine.filter.packages.namespaceFree', { ns: procNs, total: totalPkg });
    }
  }
  if (pkgStatus !== 'fail' && procModifiesPackage) {
    const target = installed.find(p => p.namespace === procModifiesPackage);
    if (target && target.allowsExtension === false) {
      pkgStatus = 'fail';
      pkgReason = t('engine.filter.packages.notExtensible', { name: target.name, ns: procModifiesPackage });
    } else if (target && target.licenseType && target.licenseType.toLowerCase().includes('oem')) {
      pkgStatus = pkgStatus === 'pass' ? 'warn' : pkgStatus;
      pkgReason = t('engine.filter.packages.oemLicense', { name: target.name });
    }
  }
  if (pkgStatus === 'pass' && totalPkg > 250) {
    pkgStatus = 'warn';
    pkgReason = t('engine.filter.packages.tooMany', { total: totalPkg });
  }
  filters.push({ key: 'packages', label: t('engine.filter.packages.label'), status: pkgStatus, reason: pkgReason });

  // Filtro 9: KYC / Sanctions / feeds externos
  const procFeeds = (() => {
    const raw2 = proc.externalFeeds;
    if (Array.isArray(raw2)) return raw2;
    if (typeof raw2 === 'string' && raw2) return raw2.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  })();
  let feedsStatus, feedsReason;
  if (procFeeds.length === 0) {
    feedsStatus = 'pass';
    feedsReason = t('engine.filter.sanctions.none');
  } else {
    const orgFeeds = new Set((org.externalFeeds || []).map(f => f.toLowerCase()));
    const missing = procFeeds.filter(f => !orgFeeds.has(f.toLowerCase()));
    if (missing.length === 0) {
      feedsStatus = 'pass';
      feedsReason = t('engine.filter.sanctions.allAvailable', { list: procFeeds.join(', ') });
    } else if (missing.length === procFeeds.length) {
      feedsStatus = 'fail';
      feedsReason = t('engine.filter.sanctions.noneAvailable', { list: procFeeds.join(', ') });
    } else {
      feedsStatus = 'warn';
      feedsReason = t('engine.filter.sanctions.partial', { missing: missing.join(', ') });
    }
  }
  filters.push({ key: 'sanctions', label: t('engine.filter.sanctions.label'), status: feedsStatus, reason: feedsReason });

  // Filtro 10: Custo de migração/coexistência
  const permMig = numParse(proc.permSetsToClone);
  const trigMig = numParse(proc.triggersToRefactor);
  const flowMig = numParse(proc.flowsToMigrate);
  const migTotal = permMig + trigMig + flowMig;
  let migStatus, migReason;
  if (migTotal === 0) {
    migStatus = 'warn';
    migReason = t('engine.filter.migrationCost.noEstimate');
  } else {
    const days = Math.round((permMig * 0.5 + trigMig * 1.5 + flowMig * 1) * 10) / 10;
    if (days >= 60) {
      migStatus = 'fail';
      migReason = t('engine.filter.migrationCost.blocker', { days, perm: permMig, trig: trigMig, flow: flowMig });
    } else if (days >= 20) {
      migStatus = 'warn';
      migReason = t('engine.filter.migrationCost.heavy', { days });
    } else {
      migStatus = 'pass';
      migReason = t('engine.filter.migrationCost.light', { days, perm: permMig, trig: trigMig, flow: flowMig });
    }
  }
  filters.push({ key: 'migrationCost', label: t('engine.filter.migrationCost.label'), status: migStatus, reason: migReason });

  // Filtro 11: Sandbox strategy
  const fullCopy = org.fullCopySandboxes || 0;
  const partialCopy = org.partialCopySandboxes || 0;
  const devSbx = org.developerSandboxes || 0;
  const lastRefresh = org.lastSandboxRefresh;
  const procCriticality = (proc.criticality || 'medium').toLowerCase();
  let sbxStatus, sbxReason;
  if (fullCopy === 0 && partialCopy === 0 && devSbx === 0 && !lastRefresh) {
    sbxStatus = 'warn';
    sbxReason = t('engine.filter.sandbox.noStrategy');
  } else if (procCriticality === 'critical' && fullCopy === 0) {
    sbxStatus = 'fail';
    sbxReason = t('engine.filter.sandbox.criticalNoFullCopy');
  } else if (lastRefresh) {
    const refresh = new Date(lastRefresh);
    const now = new Date('2026-07-06');
    const days = Math.floor((now - refresh) / (1000 * 60 * 60 * 24));
    if (days > 180) {
      sbxStatus = 'warn';
      sbxReason = t('engine.filter.sandbox.staleRefresh', { days });
    } else {
      sbxStatus = 'pass';
      sbxReason = t('engine.filter.sandbox.ok', { full: fullCopy, partial: partialCopy, dev: devSbx, days });
    }
  } else {
    sbxStatus = 'pass';
    sbxReason = t('engine.filter.sandbox.noRefreshDate', { full: fullCopy, partial: partialCopy, dev: devSbx });
  }
  filters.push({ key: 'sandbox', label: t('engine.filter.sandbox.label'), status: sbxStatus, reason: sbxReason });

  // Filtro 12: Backup / DR
  const backupProv = org.backupProvider;
  const rto = org.rtoHours || 0;
  const rpo = org.rpoHours || 0;
  const requiredRto = numParse(proc.requiredRtoHours) || 24;
  const requiredRpo = numParse(proc.requiredRpoHours) || 24;
  let bkStatus, bkReason;
  if (!backupProv) {
    if (procCriticality === 'critical') {
      bkStatus = 'fail';
      bkReason = t('engine.filter.backupDR.criticalNoBackup');
    } else {
      bkStatus = 'warn';
      bkReason = t('engine.filter.backupDR.noProvider');
    }
  } else if (rto > requiredRto || rpo > requiredRpo) {
    bkStatus = 'fail';
    bkReason = t('engine.filter.backupDR.slaMiss', { provider: backupProv, rto, rpo, reqRto: requiredRto, reqRpo: requiredRpo });
  } else if (procCriticality === 'critical' && (rto === 0 || rpo === 0)) {
    bkStatus = 'warn';
    bkReason = t('engine.filter.backupDR.noSla', { provider: backupProv });
  } else if (procCriticality === 'critical' && org.backupFrequency && org.backupFrequency !== 'daily' && org.backupFrequency !== 'hourly') {
    bkStatus = 'warn';
    bkReason = t('engine.filter.backupDR.lowFrequency', { provider: backupProv, freq: org.backupFrequency });
  } else {
    bkStatus = 'pass';
    bkReason = t('engine.filter.backupDR.ok', { provider: backupProv, freq: org.backupFrequency || t('engine.filter.backupDR.freqNa'), rto, rpo });
  }
  filters.push({ key: 'backupDR', label: t('engine.filter.backupDR.label'), status: bkStatus, reason: bkReason });

  // Filtro 13: Concurrent limits
  const concApi = org.concurrentApiUsagePct || 0;
  const stream = org.streamingClientsPct || 0;
  const bulk = org.bulkJobsDailyPct || 0;
  const maxConc = Math.max(concApi, stream, bulk);
  let concStatus, concReason;
  const orgConcLimit = org.concurrentApiLimit || 0;
  if (maxConc === 0) {
    concStatus = 'warn';
    const limitStr = orgConcLimit ? t('engine.filter.concurrentLimits.limitSuffix', { limit: orgConcLimit }) : '';
    concReason = t('engine.filter.concurrentLimits.notMeasured', { limit: limitStr });
  } else if (maxConc >= 85) {
    concStatus = 'fail';
    concReason = t('engine.filter.concurrentLimits.critical', { api: concApi, stream, bulk });
  } else if (maxConc >= 70) {
    concStatus = 'warn';
    concReason = t('engine.filter.concurrentLimits.tight', { max: maxConc });
  } else {
    concStatus = 'pass';
    concReason = t('engine.filter.concurrentLimits.ok', { api: concApi, stream, bulk });
  }
  filters.push({ key: 'concurrentLimits', label: t('engine.filter.concurrentLimits.label'), status: concStatus, reason: concReason });

  // Filtro 14: Timezone / locale
  const procTz = (proc.targetTimezone || '').trim();
  const orgTz = org.timezone;
  let tzStatus, tzReason;
  if (!procTz) {
    tzStatus = 'pass';
    tzReason = t('engine.filter.timezone.none');
  } else if (!orgTz) {
    tzStatus = 'warn';
    tzReason = t('engine.filter.timezone.orgUnknown', { proc: procTz });
  } else if (procTz === orgTz) {
    tzStatus = 'pass';
    tzReason = t('engine.filter.timezone.match', { tz: procTz });
  } else if (procTz.toLowerCase() === 'multi' || procTz.toLowerCase() === 'global') {
    tzStatus = 'warn';
    tzReason = t('engine.filter.timezone.multiRegion', { org: orgTz });
  } else {
    tzStatus = 'fail';
    tzReason = t('engine.filter.timezone.mismatch', { proc: procTz, org: orgTz });
  }
  filters.push({ key: 'timezone', label: t('engine.filter.timezone.label'), status: tzStatus, reason: tzReason });

  // Filtro 15: External tenants (MC, DC, Auth0, ERP...)
  const procTenants = (() => {
    const raw2 = proc.requiredTenants;
    if (Array.isArray(raw2)) return raw2;
    if (typeof raw2 === 'string' && raw2) return raw2.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  })();
  let tenStatus, tenReason;
  if (procTenants.length === 0) {
    tenStatus = 'pass';
    tenReason = t('engine.filter.externalTenants.none');
  } else {
    const connected = new Set((org.connectedTenants || []).map(tn => tn.toLowerCase()));
    const missing = procTenants.filter(tn => !connected.has(tn.toLowerCase()));
    if (missing.length === 0) {
      tenStatus = 'pass';
      tenReason = t('engine.filter.externalTenants.allConnected', { list: procTenants.join(', ') });
    } else if (missing.length === procTenants.length) {
      tenStatus = 'fail';
      tenReason = t('engine.filter.externalTenants.noneConnected', { list: procTenants.join(', ') });
    } else {
      tenStatus = 'warn';
      tenReason = t('engine.filter.externalTenants.partial', { missing: missing.join(', ') });
    }
  }
  filters.push({ key: 'externalTenants', label: t('engine.filter.externalTenants.label'), status: tenStatus, reason: tenReason });

  // Filtro 16: Support tier
  const tier = (org.supportTier || '').toLowerCase();
  const tierRank = { standard: 1, premier: 2, signature: 3 };
  let supStatus, supReason;
  const requiredTier = procCriticality === 'critical' ? 'premier' : procCriticality === 'high' ? 'premier' : 'standard';
  if (!tier) {
    supStatus = procCriticality === 'critical' ? 'fail' : 'warn';
    supReason = t('engine.filter.supportTier.unknown', { crit: procCriticality, required: requiredTier });
  } else if ((tierRank[tier] || 0) >= (tierRank[requiredTier] || 0)) {
    supStatus = 'pass';
    supReason = t('engine.filter.supportTier.ok', { tier, crit: procCriticality });
  } else {
    supStatus = 'fail';
    supReason = t('engine.filter.supportTier.insufficient', { tier, crit: procCriticality, required: requiredTier });
  }
  filters.push({ key: 'supportTier', label: t('engine.filter.supportTier.label'), status: supStatus, reason: supReason });

  // Filtro 17: Incidents / uptime
  const inc = org.incidentsLast12mo;
  const upt = org.uptimePct;
  let opStatus, opReason;
  const incStr = inc != null ? t('engine.filter.incidents.incValue', { n: inc }) : t('engine.filter.incidents.incNa');
  const uptStr = upt != null ? t('engine.filter.incidents.uptimeValue', { pct: upt }) : t('engine.filter.incidents.uptimeNa');
  if (inc == null && upt == null) {
    opStatus = 'warn';
    opReason = t('engine.filter.incidents.none');
  } else if ((inc != null && inc >= 5) || (upt != null && upt < 99.0)) {
    opStatus = 'fail';
    opReason = t('engine.filter.incidents.degraded', { inc: incStr, upt: uptStr });
  } else if ((inc != null && inc >= 2) || (upt != null && upt < 99.5)) {
    opStatus = 'warn';
    opReason = t('engine.filter.incidents.tight', { inc: incStr, upt: uptStr });
  } else {
    opStatus = 'pass';
    opReason = t('engine.filter.incidents.healthy', { inc: incStr, upt: uptStr });
  }
  filters.push({ key: 'incidents', label: t('engine.filter.incidents.label'), status: opStatus, reason: opReason });

  // Filtro 18: Documentation
  const docs = org.documentationScore;
  let docStatus, docReason;
  if (docs == null) {
    docStatus = 'warn';
    docReason = t('engine.filter.documentation.none');
  } else if (docs < 40) {
    docStatus = 'fail';
    docReason = t('engine.filter.documentation.insufficient', { score: docs });
  } else if (docs < 70) {
    docStatus = 'warn';
    docReason = t('engine.filter.documentation.partial', { score: docs });
  } else {
    docStatus = 'pass';
    docReason = t('engine.filter.documentation.ok', { score: docs });
  }
  filters.push({ key: 'documentation', label: t('engine.filter.documentation.label'), status: docStatus, reason: docReason });

  // Filtro 19: UX overhead
  const tabs = org.tabCount || 0;
  const layouts = org.layoutCount || 0;
  const rts = org.recordTypeCount || 0;
  let uxStatus, uxReason;
  if (tabs === 0 && layouts === 0 && rts === 0) {
    uxStatus = 'pass';
    uxReason = t('engine.filter.uxOverhead.none');
  } else if (tabs > 150 || layouts > 300 || rts > 100) {
    uxStatus = 'fail';
    uxReason = t('engine.filter.uxOverhead.degraded', { tabs, layouts, rts });
  } else if (tabs > 100 || layouts > 200 || rts > 60) {
    uxStatus = 'warn';
    uxReason = t('engine.filter.uxOverhead.heavy', { tabs, layouts, rts });
  } else {
    uxStatus = 'pass';
    uxReason = t('engine.filter.uxOverhead.ok', { tabs, layouts, rts });
  }
  filters.push({ key: 'uxOverhead', label: t('engine.filter.uxOverhead.label'), status: uxStatus, reason: uxReason });

  // Filtro 20: Platform Events / CDC / Pub-Sub API
  const parseEventList = raw2 => {
    if (Array.isArray(raw2)) {
      return raw2.map(e => typeof e === 'string'
        ? { name: e, dailyVolume: 0 }
        : { name: e.name || '', dailyVolume: numParse(e.dailyVolume) });
    }
    if (typeof raw2 === 'string' && raw2) {
      return raw2.split(',').map(s => s.trim()).filter(Boolean).map(s => {
        const m = s.match(/^(.+?)(?::(\d+))?$/);
        return { name: m[1].trim(), dailyVolume: m[2] ? parseInt(m[2], 10) : 0 };
      });
    }
    return [];
  };
  const parseCdcList = raw2 => {
    if (Array.isArray(raw2)) return raw2.map(String);
    if (typeof raw2 === 'string' && raw2) return raw2.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };
  const procPublishes = parseEventList(proc.publishesEvents);
  const procConsumes = parseEventList(proc.consumesEvents);
  const procRequiresCdc = parseCdcList(proc.requiresCdc);
  const procRequiresPubSubApi = proc.requiresPubSubApi === true || proc.requiresPubSubApi === 'true';

  let peStatus, peReason;
  if (procPublishes.length === 0 && procConsumes.length === 0 && procRequiresCdc.length === 0 && !procRequiresPubSubApi) {
    peStatus = 'pass';
    peReason = t('engine.filter.platformEvents.none');
  } else {
    const orgPeUsage = org.platformEventUsagePct || 0;
    const orgPublished = new Map((org.platformEventPublishedTypes || []).map(p => [p.name.toLowerCase(), p]));
    const orgCdc = new Set((org.cdcEnabledEntities || []).map(e => e.toLowerCase()));
    const orgPubSub = !!org.pubSubApiEnabled;
    const orgHvpe = !!org.hvpeEnabled;

    const issues = [];
    const warnings = [];

    // 1. Quota check — considera picos do processo
    const procTotalPubDaily = procPublishes.reduce((s, e) => s + (e.dailyVolume || 0), 0);
    const orgDailyLimit = org.platformEventDailyLimit ||
      (orgHvpe ? 1000000 : 250000);
    let projPct = orgPeUsage;
    if (procTotalPubDaily > 0 && orgDailyLimit > 0) {
      const addPct = Math.round((procTotalPubDaily / orgDailyLimit) * 100);
      projPct = orgPeUsage + addPct;
      if (projPct >= 90) issues.push(t('engine.filter.platformEvents.issue.quotaOverflow', { proj: projPct, org: orgPeUsage, add: addPct }));
      else if (projPct >= 70) warnings.push(t('engine.filter.platformEvents.warn.quotaTight', { proj: projPct, org: orgPeUsage, add: addPct }));
    } else if (orgPeUsage >= 90) {
      issues.push(t('engine.filter.platformEvents.issue.orgQuotaFull', { pct: orgPeUsage }));
    } else if (orgPeUsage >= 70) {
      warnings.push(t('engine.filter.platformEvents.warn.orgQuotaTight', { pct: orgPeUsage }));
    }

    // 2. High-volume PE requirement
    const wantsHvpe = procPublishes.some(e => e.dailyVolume > 100000);
    if (wantsHvpe && !orgHvpe) {
      issues.push(t('engine.filter.platformEvents.issue.hvpeMissing'));
    }

    // 3. Consumo de PEs não publicados
    const missingPublished = procConsumes.filter(e => !orgPublished.has(e.name.toLowerCase()));
    if (missingPublished.length > 0) {
      issues.push(t('engine.filter.platformEvents.issue.consumeMissing', { list: missingPublished.map(e => e.name).join(', ') }));
    }

    // 4. CDC entities
    const missingCdc = procRequiresCdc.filter(e => !orgCdc.has(e.toLowerCase()));
    if (missingCdc.length > 0) {
      warnings.push(t('engine.filter.platformEvents.warn.cdcMissing', { list: missingCdc.join(', ') }));
    }

    // 5. Pub/Sub API
    if (procRequiresPubSubApi && !orgPubSub) {
      issues.push(t('engine.filter.platformEvents.issue.pubSubMissing'));
    }

    if (issues.length > 0) {
      peStatus = 'fail';
      peReason = issues.join(' · ');
    } else if (warnings.length > 0) {
      peStatus = 'warn';
      peReason = warnings.join(' · ');
    } else {
      const parts = [];
      if (procPublishes.length) parts.push(t('engine.filter.platformEvents.part.publishes', { n: procPublishes.length, proj: projPct }));
      if (procConsumes.length) parts.push(t('engine.filter.platformEvents.part.consumes', { n: procConsumes.length }));
      if (procRequiresCdc.length) parts.push(t('engine.filter.platformEvents.part.cdcOk', { list: procRequiresCdc.join(', ') }));
      if (procRequiresPubSubApi) parts.push(t('engine.filter.platformEvents.part.pubSubOk'));
      peStatus = 'pass';
      peReason = t('engine.filter.platformEvents.ok', { parts: parts.join(' · ') });
    }
  }
  filters.push({ key: 'platformEvents', label: t('engine.filter.platformEvents.label'), status: peStatus, reason: peReason });

  // ============================================================
  // Filtro 21: teamCapacity — headcount + utilization + skills
  // ============================================================
  const requiredHc = numParse(proc.requiredHeadcount);
  const requiredSkills = (() => {
    if (Array.isArray(proc.requiredSkills)) return proc.requiredSkills;
    if (typeof proc.requiredSkills === 'string' && proc.requiredSkills) return proc.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  })();
  const hc = org.teamHeadcount || 0;
  const util = org.teamUtilizationPct || 0;
  const skills = new Set((org.teamSkills || []).map(s => s.toLowerCase()));
  let teamStatus, teamReason;
  if (hc === 0 && util === 0 && skills.size === 0) {
    teamStatus = 'warn';
    teamReason = t('engine.filter.teamCapacity.none');
  } else {
    const missingSkills = requiredSkills.filter(s => !skills.has(s.toLowerCase()));
    if (util >= 90 || (requiredHc > 0 && hc < requiredHc)) {
      teamStatus = 'fail';
      const fteSuffix = requiredHc ? t('engine.filter.teamCapacity.saturated.fteSuffix', { req: requiredHc }) : '';
      teamReason = t('engine.filter.teamCapacity.saturated', { hc, util, suffix: fteSuffix });
    } else if (util >= 75 || missingSkills.length > 0) {
      teamStatus = 'warn';
      const skillsSuffix = missingSkills.length ? t('engine.filter.teamCapacity.tight.skillsSuffix', { list: missingSkills.join(', ') }) : '';
      teamReason = t('engine.filter.teamCapacity.tight', { util, suffix: skillsSuffix });
    } else {
      teamStatus = 'pass';
      const skillsSuffix = requiredSkills.length ? t('engine.filter.teamCapacity.ok.skillsSuffix') : '';
      teamReason = t('engine.filter.teamCapacity.ok', { hc, util, suffix: skillsSuffix });
    }
  }
  filters.push({ key: 'teamCapacity', label: t('engine.filter.teamCapacity.label'), status: teamStatus, reason: teamReason });

  // ============================================================
  // Filtro 22: mdmOwnership — source of truth vs. consumidor
  // ============================================================
  const procTouchesMdmEntities = (() => {
    if (Array.isArray(proc.touchesMasterDataEntities)) return proc.touchesMasterDataEntities;
    if (typeof proc.touchesMasterDataEntities === 'string' && proc.touchesMasterDataEntities) return proc.touchesMasterDataEntities.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  })();
  const procMdmRole = (proc.masterDataRole || '').toLowerCase(); // 'owner' | 'consumer' | ''
  const owner = new Set((org.masterDataOwnerFor || []).map(e => e.toLowerCase()));
  const consumer = new Set((org.masterDataConsumerOf || []).map(e => e.toLowerCase()));
  let mdmStatus, mdmReason;
  if (procTouchesMdmEntities.length === 0) {
    mdmStatus = 'pass';
    mdmReason = t('engine.filter.mdmOwnership.none');
  } else if (!procMdmRole) {
    mdmStatus = 'warn';
    mdmReason = t('engine.filter.mdmOwnership.roleUndefined', { list: procTouchesMdmEntities.join(', ') });
  } else if (procMdmRole === 'owner') {
    const conflict = procTouchesMdmEntities.filter(e => owner.has(e.toLowerCase()) === false);
    if (conflict.length > 0 && procTouchesMdmEntities.some(e => consumer.has(e.toLowerCase()))) {
      mdmStatus = 'fail';
      mdmReason = t('engine.filter.mdmOwnership.owner.conflict', { list: conflict.join(', ') });
    } else if (conflict.length > 0) {
      mdmStatus = 'warn';
      mdmReason = t('engine.filter.mdmOwnership.owner.transition', { list: conflict.join(', ') });
    } else {
      mdmStatus = 'pass';
      mdmReason = t('engine.filter.mdmOwnership.owner.ok', { list: procTouchesMdmEntities.join(', ') });
    }
  } else if (procMdmRole === 'consumer') {
    const notConsumer = procTouchesMdmEntities.filter(e => !consumer.has(e.toLowerCase()));
    if (notConsumer.length === procTouchesMdmEntities.length) {
      mdmStatus = 'fail';
      mdmReason = t('engine.filter.mdmOwnership.consumer.wrongSource', { list: procTouchesMdmEntities.join(', ') });
    } else if (notConsumer.length > 0) {
      mdmStatus = 'warn';
      mdmReason = t('engine.filter.mdmOwnership.consumer.partial', { list: notConsumer.join(', ') });
    } else {
      mdmStatus = 'pass';
      mdmReason = t('engine.filter.mdmOwnership.consumer.ok', { list: procTouchesMdmEntities.join(', ') });
    }
  } else {
    mdmStatus = 'warn';
    mdmReason = t('engine.filter.mdmOwnership.unknownRole', { role: procMdmRole });
  }
  filters.push({ key: 'mdmOwnership', label: t('engine.filter.mdmOwnership.label'), status: mdmStatus, reason: mdmReason });

  // ============================================================
  // Filtro 23: peakVsSustained — pico vs. média
  // ============================================================
  const peakApiPerSec = numParse(proc.peakApiPerSec);
  const peakEventsPerSec = numParse(proc.peakEventsPerSec);
  let peakStatus, peakReason;
  if (peakApiPerSec === 0 && peakEventsPerSec === 0) {
    peakStatus = 'warn';
    peakReason = t('engine.filter.peakVsSustained.notEstimated');
  } else {
    const concurrentApiHead = 100 - (org.concurrentApiUsagePct || 0);
    const streamingHead = 100 - (org.streamingClientsPct || 0);
    const projConcApi = (org.concurrentApiUsagePct || 0) + (peakApiPerSec > 25 ? 40 : peakApiPerSec > 10 ? 20 : 5);
    const projStream = (org.streamingClientsPct || 0) + (peakEventsPerSec > 100 ? 40 : peakEventsPerSec > 25 ? 20 : 5);
    const maxProj = Math.max(projConcApi, projStream);
    if (maxProj >= 90) {
      peakStatus = 'fail';
      peakReason = t('engine.filter.peakVsSustained.overflow', { api: projConcApi, stream: projStream, apiPeak: peakApiPerSec, evtPeak: peakEventsPerSec });
    } else if (maxProj >= 70) {
      peakStatus = 'warn';
      peakReason = t('engine.filter.peakVsSustained.tight', { max: maxProj });
    } else {
      peakStatus = 'pass';
      peakReason = t('engine.filter.peakVsSustained.ok', { api: projConcApi, stream: projStream });
    }
  }
  filters.push({ key: 'peakVsSustained', label: t('engine.filter.peakVsSustained.label'), status: peakStatus, reason: peakReason });

  // ============================================================
  // Filtro 24: featureCombos — dependências transitivas
  // ============================================================
  const procFeatures = new Set(proc.features || []);
  const combos = [];
  if (procFeatures.has('dataCloud') && procFeatures.has('agentforce')) {
    if (!(org.dataCloudEnabled && org.agentforceEnabled)) {
      combos.push({ sev: 'fail', msg: t('engine.filter.featureCombos.dcAgentforceMissing') });
    } else if (!org.experienceCloudEnabled) {
      combos.push({ sev: 'warn', msg: t('engine.filter.featureCombos.dcAgentforceNoExp') });
    }
  }
  if (procFeatures.has('shield') && procFeatures.has('fat')) {
    if (!(org.shieldEnabled && org.fatEnabled)) {
      combos.push({ sev: 'fail', msg: t('engine.filter.featureCombos.shieldFatMissing') });
    }
  }
  if (procFeatures.has('experienceCloud') && procFeatures.has('shield') && !org.shieldEnabled) {
    combos.push({ sev: 'warn', msg: t('engine.filter.featureCombos.expShieldMissing') });
  }
  let comboStatus, comboReason;
  if (combos.length === 0) {
    comboStatus = 'pass';
    comboReason = t('engine.filter.featureCombos.none');
  } else if (combos.some(c => c.sev === 'fail')) {
    comboStatus = 'fail';
    comboReason = combos.map(c => c.msg).join(' · ');
  } else {
    comboStatus = 'warn';
    comboReason = combos.map(c => c.msg).join(' · ');
  }
  filters.push({ key: 'featureCombos', label: t('engine.filter.featureCombos.label'), status: comboStatus, reason: comboReason });

  // ============================================================
  // Filtro 25: runCostRecurring — licenças + add-ons mensais
  // ============================================================
  const procUsersNew = numParse(proc.newUsers);
  const procMonthlyBudget = numParse(proc.monthlyBudgetUSD);
  const costPU = org.costPerUserMonthly || 0;
  const addonCost = org.addonRunCostMonthly || 0;

  // Cascade: ativar features requer SKUs adicionais e frequentemente puxa outras.
  // Estimativas conservadoras — USD/mês típico do mercado 2026 para uma org médio-porte.
  const CASCADE_COSTS = {
    dataCloud:       { base: 12000, deps: ['identity'], depNoteKey: 'engine.filter.runCostRecurring.cascade.depNote.dataCloud' },
    agentforce:      { base: 8000,  deps: ['dataCloud','einsteinPlatform'], depNoteKey: 'engine.filter.runCostRecurring.cascade.depNote.agentforce' },
    shield:          { base: 6000,  deps: [], depNoteKey: null },
    fat:             { base: 3000,  deps: ['shield'], depNoteKey: 'engine.filter.runCostRecurring.cascade.depNote.fat' },
    eventMonitoring: { base: 4000,  deps: [], depNoteKey: null },
    experienceCloud: { base: 5000,  deps: [], depNoteKey: null },
    multiCurrency:   { base: 0,     deps: [], depNoteKey: 'engine.filter.runCostRecurring.cascade.depNote.multiCurrency' }
  };
  const cascade = { addedMonthly: 0, chain: [] };
  const featuresList = proc.features || [];
  const orgHas = {
    dataCloud: !!org.dataCloudEnabled, agentforce: !!org.agentforceEnabled,
    shield: !!org.shieldEnabled, fat: !!org.fatEnabled,
    eventMonitoring: !!org.eventMonitoringEnabled, experienceCloud: !!org.experienceCloudEnabled,
    identity: (org.availableLicenses && (org.availableLicenses.Identity || 0) > 0),
    einsteinPlatform: !!org.agentforceEnabled
  };
  const chainSeen = new Set();
  for (const f of featuresList) {
    const c = CASCADE_COSTS[f];
    if (!c || orgHas[f]) continue;
    if (chainSeen.has(f)) continue;
    chainSeen.add(f);
    cascade.addedMonthly += c.base;
    cascade.chain.push({ sku: f, monthly: c.base, note: null });
    // Deps recursivas (1 nível — suficiente na prática)
    for (const dep of c.deps) {
      if (chainSeen.has(dep) || orgHas[dep]) continue;
      chainSeen.add(dep);
      const depCost = (CASCADE_COSTS[dep] && CASCADE_COSTS[dep].base) || 3000;
      cascade.addedMonthly += depCost;
      cascade.chain.push({ sku: dep, monthly: depCost, note: c.depNoteKey ? t(c.depNoteKey) : null });
    }
  }

  let costStatus, costReason;
  if (procUsersNew === 0 && procMonthlyBudget === 0) {
    costStatus = 'warn';
    const cascadeSuffix = cascade.addedMonthly > 0
      ? t('engine.filter.runCostRecurring.cascadeSuffix.warn', { amount: cascade.addedMonthly.toLocaleString(), skus: cascade.chain.map(c=>c.sku).join(', ') })
      : '';
    costReason = t('engine.filter.runCostRecurring.notEstimated', { cascade: cascadeSuffix });
  } else {
    const projMonthly = procUsersNew * costPU + addonCost + cascade.addedMonthly;
    const cascadeStr = cascade.addedMonthly > 0
      ? t('engine.filter.runCostRecurring.cascadeSuffix.detail', { amount: cascade.addedMonthly.toLocaleString(), skus: cascade.chain.map(c=>c.sku).join(', ') })
      : '';
    if (procMonthlyBudget > 0 && projMonthly > procMonthlyBudget * 1.5) {
      costStatus = 'fail';
      costReason = t('engine.filter.runCostRecurring.exceeds', { proj: projMonthly.toLocaleString(), budget: procMonthlyBudget.toLocaleString(), cascade: cascadeStr });
    } else if (procMonthlyBudget > 0 && projMonthly > procMonthlyBudget) {
      costStatus = 'warn';
      costReason = t('engine.filter.runCostRecurring.overBudget', { proj: projMonthly.toLocaleString(), budget: procMonthlyBudget.toLocaleString(), cascade: cascadeStr });
    } else {
      costStatus = 'pass';
      costReason = t('engine.filter.runCostRecurring.ok', { proj: projMonthly.toLocaleString(), cascade: cascadeStr });
    }
  }
  filters.push({ key: 'runCostRecurring', label: t('engine.filter.runCostRecurring.label'), status: costStatus, reason: costReason, cascade });

  // ============================================================
  // Filtro 26: sessionConcurrency — long-running / future / queueable
  // ============================================================
  const clr = org.concurrentLongRunningPct || 0;
  const fqp = org.futureQueuePendingPct || 0;
  const qdepth = org.queueableDepthUsed || 0;
  const procUsesLongRunning = proc.usesLongRunning === true || proc.usesLongRunning === 'true';
  const procUsesFuture = proc.usesFuture === true || proc.usesFuture === 'true';
  const procUsesQueueable = proc.usesQueueable === true || proc.usesQueueable === 'true';
  let sessStatus, sessReason;
  if (clr === 0 && fqp === 0 && qdepth === 0 && !(procUsesLongRunning || procUsesFuture || procUsesQueueable)) {
    sessStatus = 'pass';
    sessReason = t('engine.filter.sessionConcurrency.none');
  } else {
    const issues = [];
    const warns = [];
    if (procUsesLongRunning && clr >= 80) issues.push(t('engine.filter.sessionConcurrency.issue.longRunningCrit', { pct: clr }));
    else if (procUsesLongRunning && clr >= 60) warns.push(t('engine.filter.sessionConcurrency.warn.longRunning', { pct: clr }));
    if (procUsesFuture && fqp >= 80) issues.push(t('engine.filter.sessionConcurrency.issue.futureCrit', { pct: fqp }));
    else if (procUsesFuture && fqp >= 60) warns.push(t('engine.filter.sessionConcurrency.warn.future', { pct: fqp }));
    if (procUsesQueueable && qdepth >= 5) issues.push(t('engine.filter.sessionConcurrency.issue.queueableCrit', { depth: qdepth }));
    else if (procUsesQueueable && qdepth >= 3) warns.push(t('engine.filter.sessionConcurrency.warn.queueable', { depth: qdepth }));
    if (issues.length) { sessStatus = 'fail'; sessReason = issues.join(' · '); }
    else if (warns.length) { sessStatus = 'warn'; sessReason = warns.join(' · '); }
    else { sessStatus = 'pass'; sessReason = t('engine.filter.sessionConcurrency.ok', { lr: clr, fut: fqp, depth: qdepth }); }
  }
  filters.push({ key: 'sessionConcurrency', label: t('engine.filter.sessionConcurrency.label'), status: sessStatus, reason: sessReason });

  // ============================================================
  // Filtro 27: interOrgLatency — medida P95 entre orgs
  // ============================================================
  const procMaxLatencyMs = numParse(proc.maxInterOrgLatencyMs);
  let latStatus, latReason;
  const procIntegOrgs = (proc.integratesWithOrgs || '').split(',').map(s => s.trim()).filter(Boolean);
  if (procIntegOrgs.length === 0 || procMaxLatencyMs === 0) {
    latStatus = 'pass';
    latReason = t('engine.filter.interOrgLatency.none');
  } else {
    const measurements = org.interOrgLatencyMsP95 || {};
    const missing = procIntegOrgs.filter(o => measurements[o] == null);
    const violating = procIntegOrgs.filter(o => measurements[o] != null && measurements[o] > procMaxLatencyMs);
    if (missing.length === procIntegOrgs.length) {
      latStatus = 'warn';
      latReason = t('engine.filter.interOrgLatency.notMeasured', { list: procIntegOrgs.join(', ') });
    } else if (violating.length > 0) {
      latStatus = 'fail';
      const detail = violating.map(o => `${o}=${measurements[o]}ms`).join(', ');
      latReason = t('engine.filter.interOrgLatency.violation', { max: procMaxLatencyMs, detail });
    } else if (missing.length > 0) {
      latStatus = 'warn';
      latReason = t('engine.filter.interOrgLatency.partial', { okList: procIntegOrgs.filter(o => !missing.includes(o)).join(', '), missing: missing.join(', ') });
    } else {
      latStatus = 'pass';
      const detail = procIntegOrgs.map(o => `${o}=${measurements[o]}ms`).join(', ');
      latReason = t('engine.filter.interOrgLatency.ok', { detail, max: procMaxLatencyMs });
    }
  }
  filters.push({ key: 'interOrgLatency', label: t('engine.filter.interOrgLatency.label'), status: latStatus, reason: latReason });

  // ============================================================
  // Filtro 28: sharingModelFit
  // ============================================================
  const procSharing = (proc.requiredSharingModel || '').toLowerCase();
  const orgSharing = (org.sharingModel || '').toLowerCase();
  const orgRoleDepth = org.roleHierarchyDepth || 0;
  let shStatus, shReason;
  if (!procSharing) {
    shStatus = 'pass';
    shReason = t('engine.filter.sharingModelFit.none');
  } else if (!orgSharing) {
    shStatus = 'warn';
    shReason = t('engine.filter.sharingModelFit.orgUnknown', { proc: procSharing });
  } else if (procSharing === orgSharing) {
    if (orgRoleDepth > 8) {
      shStatus = 'warn';
      shReason = t('engine.filter.sharingModelFit.deepHierarchy', { model: orgSharing, depth: orgRoleDepth });
    } else {
      shStatus = 'pass';
      shReason = t('engine.filter.sharingModelFit.aligned', { model: orgSharing, depth: orgRoleDepth });
    }
  } else if ((procSharing === 'private' && orgSharing === 'public') || (procSharing === 'public' && orgSharing === 'private')) {
    shStatus = 'fail';
    shReason = t('engine.filter.sharingModelFit.incompatible', { proc: procSharing, org: orgSharing });
  } else {
    shStatus = 'warn';
    shReason = t('engine.filter.sharingModelFit.divergent', { proc: procSharing, org: orgSharing });
  }
  filters.push({ key: 'sharingModelFit', label: t('engine.filter.sharingModelFit.label'), status: shStatus, reason: shReason });

  // ============================================================
  // Filtro 29: licenseContention — usuário do processo cabe?
  // ============================================================
  const procLicense = (proc.userLicenseRequired || '').trim();
  const availLic = org.availableLicenses || {};
  let licStatus, licReason;
  if (!procLicense) {
    licStatus = 'pass';
    licReason = t('engine.filter.licenseContention.none');
  } else {
    const availCount = availLic[procLicense];
    if (availCount == null) {
      licStatus = 'warn';
      licReason = t('engine.filter.licenseContention.notInventoried', { license: procLicense });
    } else if (availCount === 0) {
      licStatus = 'fail';
      licReason = t('engine.filter.licenseContention.zero', { license: procLicense });
    } else if (procUsersNew > availCount) {
      licStatus = 'fail';
      licReason = t('engine.filter.licenseContention.deficit', { need: procUsersNew, license: procLicense, have: availCount });
    } else if (procUsersNew > availCount * 0.75) {
      licStatus = 'warn';
      licReason = t('engine.filter.licenseContention.tight', { need: procUsersNew, have: availCount, license: procLicense });
    } else {
      licStatus = 'pass';
      licReason = t('engine.filter.licenseContention.ok', { license: procLicense, have: availCount, need: procUsersNew });
    }
  }
  filters.push({ key: 'licenseContention', label: t('engine.filter.licenseContention.label'), status: licStatus, reason: licReason });

  // ============================================================
  // Filtro 30: historicalVelocity — cadência real vs. planejada
  // ============================================================
  const cadenceDays = { weekly: 7, biweekly: 14, monthly: 30, quarterly: 90 };
  const procCadDays = cadenceDays[proc.cadence] || 30;
  const lead = org.releaseLeadTimeDays || 0;
  let velStatus, velReason;
  if (lead === 0) {
    velStatus = 'warn';
    velReason = t('engine.filter.historicalVelocity.notMeasured');
  } else if (lead > procCadDays * 1.5) {
    velStatus = 'fail';
    velReason = t('engine.filter.historicalVelocity.slow', { lead, cad: procCadDays });
  } else if (lead > procCadDays) {
    velStatus = 'warn';
    velReason = t('engine.filter.historicalVelocity.tight', { lead, cad: procCadDays });
  } else {
    velStatus = 'pass';
    velReason = t('engine.filter.historicalVelocity.ok', { lead, cad: procCadDays });
  }
  filters.push({ key: 'historicalVelocity', label: t('engine.filter.historicalVelocity.label'), status: velStatus, reason: velReason });

  // ============================================================
  // Filtro 31: testDataMask — LGPD em sandbox
  // ============================================================
  const procNeedsMask = proc.requiresDataMasking === true || proc.requiresDataMasking === 'true';
  let maskStatus, maskReason;
  if (!procNeedsMask) {
    maskStatus = 'pass';
    maskReason = t('engine.filter.testDataMask.none');
  } else if (!org.dataMaskEnabled) {
    maskStatus = 'fail';
    maskReason = t('engine.filter.testDataMask.missing');
  } else {
    maskStatus = 'pass';
    maskReason = t('engine.filter.testDataMask.ok');
  }
  filters.push({ key: 'testDataMask', label: t('engine.filter.testDataMask.label'), status: maskStatus, reason: maskReason });

  // ============================================================
  // Filtro 32: multiLanguage — translation workbench
  // ============================================================
  const procLangs = (() => {
    if (Array.isArray(proc.requiredLanguages)) return proc.requiredLanguages;
    if (typeof proc.requiredLanguages === 'string' && proc.requiredLanguages) return proc.requiredLanguages.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  })();
  const orgLangs = new Set((org.activeLanguages || []).map(l => l.toLowerCase()));
  let langStatus, langReason;
  if (procLangs.length === 0) {
    langStatus = 'pass';
    langReason = t('engine.filter.multiLanguage.none');
  } else {
    const missing = procLangs.filter(l => !orgLangs.has(l.toLowerCase()));
    if (missing.length === procLangs.length) {
      langStatus = 'fail';
      langReason = t('engine.filter.multiLanguage.noneActive', { list: procLangs.join(', ') });
    } else if (missing.length > 0) {
      langStatus = 'warn';
      langReason = t('engine.filter.multiLanguage.partial', { missing: missing.join(', ') });
    } else {
      langStatus = 'pass';
      langReason = t('engine.filter.multiLanguage.ok', { list: procLangs.join(', ') });
    }
  }
  filters.push({ key: 'multiLanguage', label: t('engine.filter.multiLanguage.label'), status: langStatus, reason: langReason });

  // ============================================================
  // Filtro 33: packageVersion — versão mínima exigida
  // ============================================================
  const procPkgVersionReq = (() => {
    const raw2 = proc.requiredPackageVersions;
    if (raw2 && typeof raw2 === 'object' && !Array.isArray(raw2)) return raw2;
    return {};
  })();
  let pvStatus, pvReason;
  const pvIssues = [];
  const pvWarns = [];
  for (const [ns, minV] of Object.entries(procPkgVersionReq)) {
    const pkg = (org.installedPackages || []).find(p => p.namespace === ns);
    if (!pkg) {
      pvIssues.push(t('engine.filter.packageVersion.notInstalled', { ns, min: minV }));
    } else if (!pkg.version) {
      pvWarns.push(t('engine.filter.packageVersion.versionMissing', { ns }));
    } else if (compareVersion(pkg.version, minV) < 0) {
      pvIssues.push(t('engine.filter.packageVersion.tooOld', { ns, version: pkg.version, min: minV }));
    }
  }
  if (Object.keys(procPkgVersionReq).length === 0) {
    pvStatus = 'pass'; pvReason = t('engine.filter.packageVersion.none');
  } else if (pvIssues.length) {
    pvStatus = 'fail'; pvReason = pvIssues.join(' · ');
  } else if (pvWarns.length) {
    pvStatus = 'warn'; pvReason = pvWarns.join(' · ');
  } else {
    pvStatus = 'pass'; pvReason = t('engine.filter.packageVersion.ok', { list: Object.keys(procPkgVersionReq).join(', ') });
  }
  filters.push({ key: 'packageVersion', label: t('engine.filter.packageVersion.label'), status: pvStatus, reason: pvReason });

  // ============================================================
  // Filtro 34: retentionPolicy — Field History / Big Objects
  // ============================================================
  const procRetMonths = numParse(proc.requiredFieldHistoryMonths);
  const procNeedsBigObjects = proc.requiresBigObjects === true || proc.requiresBigObjects === 'true';
  const orgRetMonths = org.fieldHistoryRetentionMonths || 0;
  let retStatus, retReason;
  if (procRetMonths === 0 && !procNeedsBigObjects) {
    retStatus = 'pass';
    retReason = t('engine.filter.retentionPolicy.none');
  } else {
    const issues = [];
    if (procRetMonths > 0 && orgRetMonths < procRetMonths) {
      issues.push(t('engine.filter.retentionPolicy.issue.fieldHistory', { have: orgRetMonths, need: procRetMonths }));
    }
    if (procNeedsBigObjects && !org.bigObjectsEnabled) {
      issues.push(t('engine.filter.retentionPolicy.issue.bigObjects'));
    }
    if (issues.length === 0) {
      retStatus = 'pass';
      retReason = t('engine.filter.retentionPolicy.ok', { fh: orgRetMonths, big: org.bigObjectsEnabled ? t('engine.filter.retentionPolicy.bigOn') : t('engine.filter.retentionPolicy.bigNa') });
    } else if (procRetMonths > 0 && orgRetMonths >= procRetMonths / 2) {
      retStatus = 'warn';
      retReason = issues.join(' · ') + t('engine.filter.retentionPolicy.partialSuffix');
    } else {
      retStatus = 'fail';
      retReason = issues.join(' · ');
    }
  }
  filters.push({ key: 'retentionPolicy', label: t('engine.filter.retentionPolicy.label'), status: retStatus, reason: retReason });

  // ============================================================
  // Filtro 35: marketingConsent — preference center unificado
  // ============================================================
  const procNeedsConsent = proc.requiresConsentFramework === true || proc.requiresConsentFramework === 'true';
  let consStatus, consReason;
  if (!procNeedsConsent) {
    consStatus = 'pass';
    consReason = t('engine.filter.marketingConsent.none');
  } else if (!org.consentFramework) {
    consStatus = 'fail';
    consReason = t('engine.filter.marketingConsent.missing');
  } else {
    consStatus = 'pass';
    consReason = t('engine.filter.marketingConsent.ok', { framework: org.consentFramework });
  }
  filters.push({ key: 'marketingConsent', label: t('engine.filter.marketingConsent.label'), status: consStatus, reason: consReason });

  // ============================================================
  // Filtro 36: finopsObservability
  // ============================================================
  const procHighConsumption = proc.hasHighConsumption === true || proc.hasHighConsumption === 'true';
  let finStatus, finReason;
  if (!procHighConsumption) {
    finStatus = 'pass';
    finReason = t('engine.filter.finopsObservability.none');
  } else if (!org.finopsObservability) {
    finStatus = 'fail';
    finReason = t('engine.filter.finopsObservability.missing');
  } else {
    finStatus = 'pass';
    finReason = t('engine.filter.finopsObservability.ok');
  }
  filters.push({ key: 'finopsObservability', label: t('engine.filter.finopsObservability.label'), status: finStatus, reason: finReason });

  // ============================================================
  // Filtro 37: sandboxCoordination — refresh coordenado
  // ============================================================
  const procNeedsCoordinated = proc.requiresCoordinatedSandbox === true || proc.requiresCoordinatedSandbox === 'true';
  let sbcStatus, sbcReason;
  if (!procNeedsCoordinated) {
    sbcStatus = 'pass';
    sbcReason = t('engine.filter.sandboxCoordination.none');
  } else if (!org.sandboxRefreshCoordinated) {
    sbcStatus = 'fail';
    sbcReason = t('engine.filter.sandboxCoordination.missing');
  } else {
    sbcStatus = 'pass';
    sbcReason = t('engine.filter.sandboxCoordination.ok');
  }
  filters.push({ key: 'sandboxCoordination', label: t('engine.filter.sandboxCoordination.label'), status: sbcStatus, reason: sbcReason });

  // ============================================================
  // Filtro 38: vendorContract — renovação/licenciamento com terceiros
  // ============================================================
  const procDependsVendors = (() => {
    if (Array.isArray(proc.dependsOnVendorContracts)) return proc.dependsOnVendorContracts;
    if (typeof proc.dependsOnVendorContracts === 'string' && proc.dependsOnVendorContracts) return proc.dependsOnVendorContracts.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  })();
  const expiring = new Set((org.vendorContractsExpiring || []).map(v => v.toLowerCase()));
  let vcStatus, vcReason;
  if (procDependsVendors.length === 0) {
    vcStatus = 'pass';
    vcReason = t('engine.filter.vendorContract.none');
  } else {
    const risky = procDependsVendors.filter(v => expiring.has(v.toLowerCase()));
    if (risky.length === procDependsVendors.length) {
      vcStatus = 'fail';
      vcReason = t('engine.filter.vendorContract.allExpiring', { list: risky.join(', ') });
    } else if (risky.length > 0) {
      vcStatus = 'warn';
      vcReason = t('engine.filter.vendorContract.someExpiring', { list: risky.join(', ') });
    } else {
      vcStatus = 'pass';
      vcReason = t('engine.filter.vendorContract.ok', { list: procDependsVendors.join(', ') });
    }
  }
  filters.push({ key: 'vendorContract', label: t('engine.filter.vendorContract.label'), status: vcStatus, reason: vcReason });

  // ============================================================
  // Filtro 39: envStrategy — canary/feature flag conflict
  // ============================================================
  const procUsesCanary = proc.requiresCanaryRelease === true || proc.requiresCanaryRelease === 'true';
  const orgEnv = (org.envStrategy || '').toLowerCase();
  let envStatus, envReason;
  if (!procUsesCanary) {
    envStatus = 'pass';
    envReason = t('engine.filter.envStrategy.none');
  } else if (!orgEnv) {
    envStatus = 'warn';
    envReason = t('engine.filter.envStrategy.orgUndeclared');
  } else if (orgEnv === 'prod-only' || orgEnv === 'bigbang') {
    envStatus = 'fail';
    envReason = t('engine.filter.envStrategy.incompatible', { env: orgEnv });
  } else {
    envStatus = 'pass';
    envReason = t('engine.filter.envStrategy.ok', { env: orgEnv });
  }
  filters.push({ key: 'envStrategy', label: t('engine.filter.envStrategy.label'), status: envStatus, reason: envReason });

  // ============================================================
  // Filtro 40: growthTrend — degradação projetada 12mo
  // ============================================================
  const growth = org.storageGrowthPctPerMonth || 0;
  let grStatus, grReason;
  if (growth === 0) {
    grStatus = 'warn';
    grReason = t('engine.filter.growthTrend.notMeasured');
  } else {
    const proj12mo = (org.storagePct || 0) + growth * 12;
    if (proj12mo >= 100) {
      grStatus = 'fail';
      grReason = t('engine.filter.growthTrend.overflow', { proj: Math.round(proj12mo), growth });
    } else if (proj12mo >= 85) {
      grStatus = 'warn';
      grReason = t('engine.filter.growthTrend.nearCap', { proj: Math.round(proj12mo) });
    } else {
      grStatus = 'pass';
      grReason = t('engine.filter.growthTrend.ok', { proj: Math.round(proj12mo) });
    }
  }
  filters.push({ key: 'growthTrend', label: t('engine.filter.growthTrend.label'), status: grStatus, reason: grReason });

  // ============================================================
  // Filtro 41: metadataComplexity — count de custom fields, apex, roles, sharing, triggers, flows, permsets, territory
  // ============================================================
  const complexityScore = (() => {
    let score = 0;
    if ((org.customFieldCount || 0) > 30000) score += 3;
    else if ((org.customFieldCount || 0) > 15000) score += 1;
    if ((org.apexClassCount || 0) > 3000) score += 3;
    else if ((org.apexClassCount || 0) > 1500) score += 1;
    if ((org.userRoleCount || 0) > 5000) score += 3;
    else if ((org.userRoleCount || 0) > 2000) score += 1;
    if ((org.sharingRuleCount || 0) > 400) score += 3;
    else if ((org.sharingRuleCount || 0) > 200) score += 1;
    if ((org.territoryModelCount || 0) > 3) score += 2;
    if ((org.permSetCount || 0) > 500) score += 2;
    else if ((org.permSetCount || 0) > 200) score += 1;
    if ((org.triggerCount || 0) > 200) score += 2;
    if ((org.flowCount || 0) > 500) score += 2;
    else if ((org.flowCount || 0) > 200) score += 1;
    return score;
  })();
  let complexityStatus, complexityReason;
  const detail = t('engine.filter.metadataComplexity.detail', {
    cf: org.customFieldCount || 0,
    apex: org.apexClassCount || 0,
    roles: org.userRoleCount || 0,
    sharing: org.sharingRuleCount || 0,
    territory: org.territoryModelCount || 0,
    permsets: org.permSetCount || 0,
    triggers: org.triggerCount || 0,
    flows: org.flowCount || 0
  });
  if (complexityScore >= 8) {
    complexityStatus = 'fail';
    complexityReason = t('engine.filter.metadataComplexity.high', { score: complexityScore, detail });
  } else if (complexityScore >= 4) {
    complexityStatus = 'warn';
    complexityReason = t('engine.filter.metadataComplexity.moderate', { score: complexityScore, detail });
  } else {
    complexityStatus = 'pass';
    complexityReason = t('engine.filter.metadataComplexity.ok', { score: complexityScore, detail });
  }
  filters.push({ key: 'metadataComplexity', label: t('engine.filter.metadataComplexity.label'), status: complexityStatus, reason: complexityReason });

  // ============================================================
  // Filtro 42: adminHygiene — Modify All Data espalhado
  // ============================================================
  const mad = org.modifyAllPermSets || 0;
  const madU = org.modifyAllUserCount || 0;
  let adminStatus, adminReason;
  if (mad === 0 && madU === 0) {
    adminStatus = 'warn';
    adminReason = t('engine.filter.adminHygiene.notMeasured');
  } else if (mad > 10 || madU > 30) {
    adminStatus = 'fail';
    adminReason = t('engine.filter.adminHygiene.spread', { perm: mad, users: madU });
  } else if (mad > 5 || madU > 15) {
    adminStatus = 'warn';
    adminReason = t('engine.filter.adminHygiene.moderate', { perm: mad, users: madU });
  } else {
    adminStatus = 'pass';
    adminReason = t('engine.filter.adminHygiene.ok', { perm: mad, users: madU });
  }
  filters.push({ key: 'adminHygiene', label: t('engine.filter.adminHygiene.label'), status: adminStatus, reason: adminReason });

  const failCount = filters.filter(f => f.status === 'fail').length;
  const warnCount = filters.filter(f => f.status === 'warn').length;
  const overall = failCount > 0 ? 'fail' : warnCount > 0 ? 'warn' : 'pass';

  // Score bruto (não ponderado) — comparável entre processos de qualquer criticidade
  const scoreRaw = filters.reduce((s, f) => s + (f.status === 'pass' ? 3 : f.status === 'warn' ? 1 : -2), 0);

  // Score ponderado por criticidade do processo:
  //   Só o LADO NEGATIVO escala. Pass e warn valem igual em qualquer criticidade
  //   (senão critical amplifica tudo, incluindo passes, e o efeito líquido se anula).
  //   O objetivo é fazer fail doer mais quando o processo é mais crítico.
  //   critical → fail dói 3× mais
  //   high     → fail dói 2×
  //   medium   → 1× (referência)
  //   low      → fail dói 0.5× (tolerância maior)
  const critMap = {
    critical: { passMult: 1.0, warnMult: 1.0, failMult: 3.0 },
    high:     { passMult: 1.0, warnMult: 1.0, failMult: 2.0 },
    medium:   { passMult: 1.0, warnMult: 1.0, failMult: 1.0 },
    low:      { passMult: 1.0, warnMult: 1.0, failMult: 0.5 }
  };
  const crit = critMap[(proc.criticality || 'medium').toLowerCase()] || critMap.medium;
  const score = filters.reduce((s, f) => {
    if (f.status === 'pass') return s + 3 * crit.passMult;
    if (f.status === 'warn') return s + 1 * crit.warnMult;
    return s - 2 * crit.failMult;
  }, 0);

  return { org, filters, overall, score: Math.round(score), scoreRaw, criticalityFactor: crit, failCount, warnCount };
}

// Análise do landscape inteiro. Chamada uma vez com todas as evaluations.
// Devolve:
//   - recommendation: 'reuse' | 'reuse-with-warnings' | 'consolidate-first' | 'new-org' | 'no-viable-option'
//   - primaryChoice: org candidata principal (quando aplicável)
//   - consolidations: pares/trios de orgs que podem ser consolidadas
//   - rebalancing: dicas de load rebalancing (quota alta vs. folga)
//   - newOrgRationale: critério positivo para nova org (quando aplicável)
export function analyzeLandscape(evaluations, proc) {
  const passing = evaluations.filter(e => e.overall === 'pass');
  const warning = evaluations.filter(e => e.overall === 'warn');
  const failing = evaluations.filter(e => e.overall === 'fail');

  // 1. Consolidation opportunities — mesma "familia" (regulator + dataController + dataModel)
  //    e ambas com capacidade folgada. Se existe par assim, sugere consolidar antes de alocar.
  const consolidations = [];
  const orgs = evaluations.map(e => e.org);
  for (let i = 0; i < orgs.length; i++) {
    for (let j = i + 1; j < orgs.length; j++) {
      const a = orgs[i], b = orgs[j];
      const sameRegulator = a.regulator && a.regulator === b.regulator;
      const sameController = a.dataControllerLGPD && a.dataControllerLGPD === b.dataControllerLGPD;
      const sameModel = a.dataModel && a.dataModel === b.dataModel;
      const combinedStoragePct = (a.storagePct || 0) + (b.storagePct || 0);
      const combinedApiPct = (a.apiUsagePct || 0) + (b.apiUsagePct || 0);
      const combinedObjPct = (a.customObjectLimitPct || 0) + (b.customObjectLimitPct || 0);
      const combinedFits = combinedStoragePct < 80 && combinedApiPct < 80 && combinedObjPct < 80;
      if (sameRegulator && sameController && sameModel && combinedFits) {
        consolidations.push({
          orgs: [a.orgName, b.orgName],
          rationale: t('engine.consolidation.rationale', { regulator: a.regulator, model: a.dataModel, storage: combinedStoragePct, api: combinedApiPct, objs: combinedObjPct }),
          savingsEstimate: t('engine.consolidation.savings', { amount: (a.addonRunCostMonthly || 5000).toLocaleString() })
        });
      }
    }
  }

  // 2. Load rebalancing — quotas críticas vs folgadas dentro do mesmo perímetro
  const rebalancing = [];
  const heavyOrgs = orgs.filter(o => (o.platformEventUsagePct || 0) > 75 || (o.apiUsagePct || 0) > 75 || (o.storagePct || 0) > 75);
  const lightOrgs = orgs.filter(o => (o.platformEventUsagePct || 0) < 30 && (o.apiUsagePct || 0) < 30 && (o.storagePct || 0) < 40);
  for (const heavy of heavyOrgs) {
    const compatibleLight = lightOrgs.find(l =>
      l.regulator === heavy.regulator &&
      l.dataControllerLGPD === heavy.dataControllerLGPD &&
      l.dataModel === heavy.dataModel &&
      l.orgName !== heavy.orgName
    );
    if (compatibleLight) {
      rebalancing.push({
        heavy: heavy.orgName,
        light: compatibleLight.orgName,
        rationale: t('engine.rebalancing.rationale', { heavy: heavy.orgName, storage: heavy.storagePct || 0, api: heavy.apiUsagePct || 0, pe: heavy.platformEventUsagePct || 0, light: compatibleLight.orgName })
      });
    }
  }

  // 3. Nova org como recomendação explícita
  //    Critérios positivos (não apenas "nada passa"):
  //      A. Regulator/dataController inéditos no landscape (nenhuma org tem esse perfil)
  //      B. Criticalidade critical + zero orgs pass com dado completo
  //      C. Feature irreversível conflitante em toda org (ex: personAccount vs. b2b)
  //      D. Isolamento explícito (M&A, JV, subsidiária com controller diferente)
  const newOrgRationale = [];
  const anyOrgSameRegulator = orgs.some(o => o.regulator === proc.regulator);
  const anyOrgSameController = orgs.some(o => o.dataControllerLGPD && proc.dataController === 'SAME');
  const procCrit = (proc.criticality || 'medium').toLowerCase();
  if (proc.regulator && proc.regulator !== 'NONE' && !anyOrgSameRegulator) {
    newOrgRationale.push({
      criterion: t('engine.newOrg.criterion.regulatorInedito'),
      detail: t('engine.newOrg.detail.regulatorInedito', { reg: proc.regulator })
    });
  }
  if (proc.dataController === 'DIFFERENT') {
    newOrgRationale.push({
      criterion: t('engine.newOrg.criterion.controllerDistinct'),
      detail: t('engine.newOrg.detail.controllerDistinct')
    });
  }
  if (proc.dataModel === 'personAccount' && !orgs.some(o => o.hasPersonAccount)) {
    newOrgRationale.push({
      criterion: t('engine.newOrg.criterion.personAccountInedito'),
      detail: t('engine.newOrg.detail.personAccountInedito')
    });
  }
  if (procCrit === 'critical' && passing.length === 0 && warning.filter(w => w.warnCount <= 3).length === 0) {
    newOrgRationale.push({
      criterion: t('engine.newOrg.criterion.criticalSaturated'),
      detail: t('engine.newOrg.detail.criticalSaturated')
    });
  }

  // 4. Recomendação síntese
  let recommendation, primaryChoice, summary;
  if (newOrgRationale.length > 0) {
    recommendation = 'new-org';
    primaryChoice = null;
    summary = t('engine.landscape.summary.newOrg', { criteria: newOrgRationale.map(r => r.criterion).join(', ') });
  } else if (consolidations.length > 0 && passing.length === 0) {
    recommendation = 'consolidate-first';
    primaryChoice = consolidations[0].orgs;
    summary = t('engine.landscape.summary.consolidateFirst', { orgs: consolidations[0].orgs.join(' + ') });
  } else if (passing.length > 0) {
    recommendation = 'reuse';
    primaryChoice = passing[0].org.orgName;
    const altSuffix = passing.length > 1 ? t('engine.landscape.summary.reuseAltSuffix', { n: passing.length - 1 }) : '';
    summary = t('engine.landscape.summary.reuse', { org: passing[0].org.orgName, score: passing[0].score, suffix: altSuffix });
  } else if (warning.length > 0) {
    recommendation = 'reuse-with-warnings';
    primaryChoice = warning[0].org.orgName;
    summary = t('engine.landscape.summary.reuseWithWarnings', { org: warning[0].org.orgName, warnings: warning[0].warnCount });
  } else {
    recommendation = 'no-viable-option';
    primaryChoice = null;
    summary = t('engine.landscape.summary.noViable');
  }

  return {
    recommendation,
    primaryChoice,
    summary,
    consolidations,
    rebalancing,
    newOrgRationale,
    stats: {
      total: evaluations.length,
      passing: passing.length,
      warning: warning.length,
      failing: failing.length
    }
  };
}
