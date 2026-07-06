// Motor de avaliação para o Modo Alocação.
// Funções puras, exportadas como ES Module. Sem dependência de DOM ou de estado global.
// Usado tanto pelo HTML (via <script type="module">) quanto pelo test harness (via import).

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
    regReason = 'Processo não regulado — nenhuma restrição de perímetro.';
  } else if (orgRegulator === 'unknown') {
    regStatus = 'warn';
    regReason = 'Perímetro regulatório da org não declarado. Levantar com Compliance antes de decidir.';
  } else if (orgRegulator === procRegulator) {
    regStatus = 'pass';
    regReason = `Mesmo regulador (${procRegulator}) — perímetro compatível.`;
  } else {
    regStatus = 'fail';
    regReason = `Regulador incompatível: processo=${procRegulator}, org=${orgRegulator}. Isolamento regulatório inviabiliza reuso.`;
  }
  filters.push({ key: 'regulator', label: 'Perímetro regulatório', status: regStatus, reason: regReason });

  // Filtro 1b: data controller LGPD
  const dc = proc.dataController;
  let dcStatus = 'pass', dcReason = '';
  if (dc === 'SAME') { dcStatus = 'pass'; dcReason = 'Mesmo data controller — reuso permitido.'; }
  else if (dc === 'DIFFERENT') { dcStatus = 'fail'; dcReason = 'Data controller distinto — sem contrato inter-partes, reuso viola LGPD.'; }
  else { dcStatus = 'warn'; dcReason = 'Data controller a definir — bloqueador se resultar distinto sem contrato.'; }
  filters.push({ key: 'dataController', label: 'Data controller LGPD', status: dcStatus, reason: dcReason });

  // Filtro 2: data model
  let dmStatus = 'pass', dmReason = '';
  if (proc.dataModel === 'personAccount') {
    if (org.hasPersonAccount) { dmStatus = 'pass'; dmReason = 'Person Account habilitado na org.'; }
    else { dmStatus = 'fail'; dmReason = 'Processo exige Person Account, org não tem (feature irreversível).'; }
  } else if (proc.dataModel === 'fsc') {
    if (org.dataModel === 'fsc') { dmStatus = 'pass'; dmReason = 'Org já é FSC.'; }
    else { dmStatus = 'fail'; dmReason = 'Processo exige Financial Services Cloud — org não é FSC.'; }
  } else if (proc.dataModel === 'b2b') {
    if (org.hasPersonAccount) { dmStatus = 'warn'; dmReason = 'Org tem Person Account habilitado; B2B convive mas com atenção a page layouts.'; }
    else { dmStatus = 'pass'; dmReason = 'Data model B2B padrão compatível.'; }
  } else if (['healthcloud','nonprofit','education','manufacturing'].includes(proc.dataModel)) {
    if (org.dataModel === proc.dataModel) { dmStatus = 'pass'; dmReason = `Org já opera como ${proc.dataModel}.`; }
    else { dmStatus = 'fail'; dmReason = `Processo exige industry cloud ${proc.dataModel} — org opera como ${org.dataModel || 'b2b padrão'}.`; }
  } else {
    dmStatus = 'warn'; dmReason = 'Data model custom/híbrido — avaliar manualmente.';
  }
  filters.push({ key: 'dataModel', label: 'Data model', status: dmStatus, reason: dmReason });

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
    featReason = (proc.features || []).length ? 'Todas as features exigidas ativas na org.' : 'Nenhuma feature especial exigida.';
  } else {
    const critical = missing.filter(f => f === 'multiCurrency');
    featStatus = critical.length ? 'fail' : 'warn';
    featReason = `Features não habilitadas: ${missing.map(f => featureMap[f][1]).join(', ')}${critical.length ? ' (Multi-Currency é irreversível)' : ' (ativação exige SKU + rollout)'}.`;
  }
  filters.push({ key: 'features', label: 'Features especiais', status: featStatus, reason: featReason });

  // Filtro 3: capacidade técnica atual
  const objLimitPct = org.customObjectLimitPct || Math.round(org.customObjectCount / 30);
  const storagePct = org.storagePct || 0;
  const apiPct = org.apiUsagePct || 0;
  const maxPct = Math.max(objLimitPct, storagePct, apiPct);
  let capStatus, capReason;
  if (maxPct >= 85) { capStatus = 'fail'; capReason = `Capacidade crítica (${maxPct}%): custom objects ${objLimitPct}% · storage ${storagePct}% · API ${apiPct}%.`; }
  else if (maxPct >= 70) { capStatus = 'warn'; capReason = `Capacidade apertada (${maxPct}%): resolver folga antes.`; }
  else { capStatus = 'pass'; capReason = `Folga confortável (max ${maxPct}%): custom objects ${objLimitPct}% · storage ${storagePct}% · API ${apiPct}%.`; }
  filters.push({ key: 'capacity', label: 'Capacidade técnica', status: capStatus, reason: capReason });

  // Filtro 3b: saúde operacional (ApexGuru)
  let healthStatus, healthReason;
  if (!org.apexGuruAvailable) {
    healthStatus = 'warn';
    healthReason = 'Sem dados de ApexGuru. Extraia insights via Setup (Signature Success Plan) — folga técnica pode esconder débito.';
  } else {
    const crit = org.apexGuruCriticalIssues || 0;
    const soql = org.apexGuruSoqlNonSelective || 0;
    const longApex = org.apexGuruLongRunningApex || 0;
    const govExc = org.apexGuruGovernorExceptions || 0;
    const trend = org.apexGuruTrend;
    const facts = [];
    if (crit) facts.push(`${crit} issues críticos`);
    if (soql) facts.push(`${soql} SOQL não-seletivo`);
    if (longApex) facts.push(`${longApex} long-running Apex`);
    if (govExc) facts.push(`${govExc} governor exceptions`);
    const factStr = facts.join(', ') || 'sem issues';
    const trendLabel = trend ? ` · trend ${trend}` : '';
    if (crit > 30 || govExc > 20 || trend === 'degrading') {
      healthStatus = 'fail';
      healthReason = `Saúde crítica: ${factStr}${trendLabel}. Refactor obrigatório antes.`;
    } else if (crit >= 10 || soql >= 5 || longApex >= 5 || trend === 'stable-on-debt') {
      healthStatus = 'warn';
      healthReason = `Saúde apertada: ${factStr}${trendLabel}. Priorize refactor dos top offenders.`;
    } else {
      healthStatus = 'pass';
      healthReason = `Saúde operacional confortável: ${factStr}${trendLabel}.`;
    }
    if (org.apexGuruTopOffenders && org.apexGuruTopOffenders.length) {
      healthReason += ` Top offenders: ${org.apexGuruTopOffenders.slice(0, 5).join(', ')}.`;
    }
  }
  filters.push({ key: 'health', label: 'Saúde operacional (ApexGuru)', status: healthStatus, reason: healthReason });

  // Filtro 4: cadência
  const cadenceOrder = { weekly: 1, biweekly: 2, monthly: 3, quarterly: 4 };
  const procCad = cadenceOrder[proc.cadence] || 3;
  const orgCad = cadenceOrder[org.releaseSchedule] || 999;
  let cadStatus, cadReason;
  if (org.releaseSchedule === 'unknown') {
    cadStatus = 'warn'; cadReason = 'Cadência de release da org não declarada.';
  } else if (procCad >= orgCad) {
    cadStatus = 'pass'; cadReason = `Cadência (${proc.cadence}) cabe na janela da org (${org.releaseSchedule}).`;
  } else if (org.package2Count > 0) {
    cadStatus = 'warn'; cadReason = `Processo exige mais frequência (${proc.cadence}) que a org (${org.releaseSchedule}), mas 2GP em uso (${org.package2Count} packages).`;
  } else {
    cadStatus = 'fail'; cadReason = `Cadência incompatível: processo=${proc.cadence}, org=${org.releaseSchedule}. Sem 2GP, releases vão se bloquear.`;
  }
  filters.push({ key: 'cadence', label: 'Cadência de release', status: cadStatus, reason: cadReason });

  // Filtro 5: Integrações inter-org
  const procIntegrates = (proc.integratesWithOrgs || '').split(',').map(s => s.trim()).filter(Boolean);
  let intStatus = 'pass', intReason = 'Sem dependência de outras orgs declarada.';
  if (procIntegrates.length > 0) {
    const known = new Set(knownOrgNames);
    const missingOrgs = procIntegrates.filter(n => !known.has(n));
    const consumed = new Set(org.consumedContracts || []);
    const published = new Set(org.publishedContracts || []);
    if (missingOrgs.length === procIntegrates.length) {
      intStatus = 'warn';
      intReason = `Processo integra com ${procIntegrates.join(', ')}, mas nenhuma dessas orgs foi carregada no inventário — validar contratos manualmente.`;
    } else if (published.size === 0 && consumed.size === 0) {
      intStatus = 'warn';
      intReason = `Processo declara integração com ${procIntegrates.join(', ')}, mas a org candidata não tem publishedContracts/consumedContracts declarados — pode faltar canal de dados.`;
    } else {
      const impacted = procIntegrates.filter(n => known.has(n));
      intStatus = 'pass';
      intReason = `Integração com ${impacted.join(', ')}; org publica ${published.size} contrato(s) e consome ${consumed.size}. Validar payload compatível.`;
    }
  }
  filters.push({ key: 'integrations', label: 'Integrações inter-org', status: intStatus, reason: intReason });

  // Filtro 6: Projeção de volume pós-alocação
  const numParse = v => (typeof v === 'string' ? parseInt(v.replace(/[.,\s_]/g, ''), 10) || 0 : (typeof v === 'number' ? v : 0));
  const procRecords = numParse(proc.estimatedRecordsPerYear);
  const procApiDaily = numParse(proc.estimatedApiCallsDaily);
  let projStatus, projReason;
  if (procRecords === 0 && procApiDaily === 0) {
    projStatus = 'warn';
    projReason = 'Sem estimativa quantitativa (registros/ano e API/dia). Processo não quantificado pode estourar limites sem aviso — colete numbers antes de decidir.';
  } else {
    const storageAdd = Math.round(procRecords / 1000000);
    const apiAddPct = Math.round((procApiDaily / 5000000) * 100);
    const projStorage = (org.storagePct || 0) + storageAdd;
    const projApi = (org.apiUsagePct || 0) + apiAddPct;
    const maxProj = Math.max(projStorage, projApi);
    if (maxProj >= 90) {
      projStatus = 'fail';
      projReason = `Pós-alocação estoura limites: storage ${projStorage}% (+${storageAdd}pp), API ${projApi}% (+${apiAddPct}pp).`;
    } else if (maxProj >= 75) {
      projStatus = 'warn';
      projReason = `Pós-alocação fica apertado: storage ${projStorage}%, API ${projApi}%. Planeje expansão antes.`;
    } else {
      projStatus = 'pass';
      projReason = `Projeção confortável: storage ${projStorage}% (+${storageAdd}pp), API ${projApi}% (+${apiAddPct}pp).`;
    }
  }
  filters.push({ key: 'projection', label: 'Projeção de volume', status: projStatus, reason: projReason });

  // Filtro 7: PCI-DSS + SOX
  const procPci = (proc.complianceScope || []).includes('pci');
  const procSox = (proc.complianceScope || []).includes('sox');
  let compStatus = 'pass', compReason = 'Processo sem requisitos PCI-DSS/SOX específicos.';
  if (procPci || procSox || org.pciInScope || org.soxScope) {
    const orgPci = !!org.pciInScope;
    const orgSox = !!org.soxScope;
    const issues = [];
    const failMarkers = [];
    const warnMarkers = [];
    if (procPci && !orgPci) { issues.push('processo é PCI mas org está fora de scope — alocar contamina a org inteira'); failMarkers.push(true); }
    if (!procPci && orgPci) { issues.push('org é PCI e processo não é — adicionar código não-PCI amplia scope de auditoria'); warnMarkers.push(true); }
    if (procSox && !orgSox) { issues.push('processo dispara SOX mas org não está sob controles SOX — implementar antes'); failMarkers.push(true); }
    if (!procSox && orgSox) { issues.push('org é SOX-controlada; validar que novo processo não introduz brechas de segregation of duties'); warnMarkers.push(true); }
    if (issues.length === 0) {
      compStatus = 'pass';
      compReason = `Compliance alinhado: PCI ${orgPci ? 'ambos in-scope' : 'ambos out-of-scope'}${procSox && orgSox ? ' · SOX alinhado' : ''}.`;
    } else if (failMarkers.length > 0) {
      compStatus = 'fail';
      compReason = issues.join(' · ');
    } else {
      compStatus = 'warn';
      compReason = issues.join(' · ');
    }
  }
  filters.push({ key: 'compliance', label: 'PCI-DSS / SOX scope', status: compStatus, reason: compReason });

  // Filtro 8: Managed packages / namespace / licença
  const procNs = (proc.requiresNamespace || '').trim();
  const procModifiesPackage = (proc.modifiesPackageNamespace || '').trim();
  let pkgStatus = 'pass', pkgReason = 'Nenhum requisito de namespace.';
  const installed = org.installedPackages || [];
  const totalPkg = Math.max(installed.length, org.installedPackageCount || 0);
  if (procNs) {
    const conflict = installed.find(p => p.namespace === procNs);
    if (conflict) {
      pkgStatus = 'fail';
      pkgReason = `Namespace "${procNs}" já ocupado pelo package "${conflict.name}" nessa org — conflito impede instalação.`;
    } else {
      pkgStatus = 'pass';
      pkgReason = `Namespace "${procNs}" livre. Org tem ${totalPkg} package(s) instalado(s).`;
    }
  }
  if (pkgStatus !== 'fail' && procModifiesPackage) {
    const target = installed.find(p => p.namespace === procModifiesPackage);
    if (target && target.allowsExtension === false) {
      pkgStatus = 'fail';
      pkgReason = `Processo precisa modificar metadata do package "${target.name}" (ns=${procModifiesPackage}), mas ele é protegido (allowsExtension=false).`;
    } else if (target && target.licenseType && target.licenseType.toLowerCase().includes('oem')) {
      pkgStatus = pkgStatus === 'pass' ? 'warn' : pkgStatus;
      pkgReason = `Modificar package OEM "${target.name}" pode violar termos de licença — revisar contrato antes.`;
    }
  }
  if (pkgStatus === 'pass' && totalPkg > 250) {
    pkgStatus = 'warn';
    pkgReason = `${totalPkg} managed packages instalados (>250 sinaliza acúmulo de dependências).`;
  }
  filters.push({ key: 'packages', label: 'Managed packages / namespace / licença', status: pkgStatus, reason: pkgReason });

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
    feedsReason = 'Processo não declara dependência de feeds externos (sanctions, KYC, credit bureau).';
  } else {
    const orgFeeds = new Set((org.externalFeeds || []).map(f => f.toLowerCase()));
    const missing = procFeeds.filter(f => !orgFeeds.has(f.toLowerCase()));
    if (missing.length === 0) {
      feedsStatus = 'pass';
      feedsReason = `Todos os feeds externos exigidos disponíveis: ${procFeeds.join(', ')}.`;
    } else if (missing.length === procFeeds.length) {
      feedsStatus = 'fail';
      feedsReason = `Nenhum feed externo exigido (${procFeeds.join(', ')}) está conectado nessa org — processo não roda sem eles.`;
    } else {
      feedsStatus = 'warn';
      feedsReason = `Feeds parcialmente disponíveis. Faltando: ${missing.join(', ')}.`;
    }
  }
  filters.push({ key: 'sanctions', label: 'KYC / Sanctions / feeds externos', status: feedsStatus, reason: feedsReason });

  // Filtro 10: Custo de migração/coexistência
  const permMig = numParse(proc.permSetsToClone);
  const trigMig = numParse(proc.triggersToRefactor);
  const flowMig = numParse(proc.flowsToMigrate);
  const migTotal = permMig + trigMig + flowMig;
  let migStatus, migReason;
  if (migTotal === 0) {
    migStatus = 'warn';
    migReason = 'Custo de migração não estimado (permsets, triggers, flows). Alocar sem esse número esconde esforço real.';
  } else {
    const days = Math.round((permMig * 0.5 + trigMig * 1.5 + flowMig * 1) * 10) / 10;
    if (days >= 60) {
      migStatus = 'fail';
      migReason = `Esforço estimado: ${days} pessoa-dia (${permMig} permsets · ${trigMig} triggers · ${flowMig} flows). Custo de migração inviabiliza o reuso.`;
    } else if (days >= 20) {
      migStatus = 'warn';
      migReason = `Esforço estimado: ${days} pessoa-dia. Peso considerável — validar contra criar org nova.`;
    } else {
      migStatus = 'pass';
      migReason = `Esforço estimado leve: ${days} pessoa-dia (${permMig} permsets · ${trigMig} triggers · ${flowMig} flows).`;
    }
  }
  filters.push({ key: 'migrationCost', label: 'Custo de migração', status: migStatus, reason: migReason });

  // Filtro 11: Sandbox strategy
  const fullCopy = org.fullCopySandboxes || 0;
  const partialCopy = org.partialCopySandboxes || 0;
  const devSbx = org.developerSandboxes || 0;
  const lastRefresh = org.lastSandboxRefresh;
  const procCriticality = (proc.criticality || 'medium').toLowerCase();
  let sbxStatus, sbxReason;
  if (fullCopy === 0 && partialCopy === 0 && devSbx === 0 && !lastRefresh) {
    sbxStatus = 'warn';
    sbxReason = 'Sandbox strategy não declarada. Sem ambiente de teste adequado, o processo entra às cegas.';
  } else if (procCriticality === 'critical' && fullCopy === 0) {
    sbxStatus = 'fail';
    sbxReason = `Processo crítico exige Full Copy sandbox para teste de dados reais — org não tem Full Copy declarado.`;
  } else if (lastRefresh) {
    const refresh = new Date(lastRefresh);
    const now = new Date('2026-07-06');
    const days = Math.floor((now - refresh) / (1000 * 60 * 60 * 24));
    if (days > 180) {
      sbxStatus = 'warn';
      sbxReason = `Último refresh do sandbox há ${days} dias — dados/metadata dessincronizados com prod.`;
    } else {
      sbxStatus = 'pass';
      sbxReason = `Sandbox strategy OK: ${fullCopy} Full Copy · ${partialCopy} Partial · ${devSbx} Dev · refresh há ${days} dias.`;
    }
  } else {
    sbxStatus = 'pass';
    sbxReason = `Sandboxes: ${fullCopy} Full Copy · ${partialCopy} Partial · ${devSbx} Dev. Data do último refresh não informada.`;
  }
  filters.push({ key: 'sandbox', label: 'Sandbox strategy', status: sbxStatus, reason: sbxReason });

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
      bkReason = 'Processo crítico e org sem backup declarado — DR ausente é bloqueador.';
    } else {
      bkStatus = 'warn';
      bkReason = 'Backup provider não declarado — validar antes de decidir.';
    }
  } else if (rto > requiredRto || rpo > requiredRpo) {
    bkStatus = 'fail';
    bkReason = `Backup ${backupProv}: RTO ${rto}h/RPO ${rpo}h não atende exigência do processo (RTO≤${requiredRto}h / RPO≤${requiredRpo}h).`;
  } else if (procCriticality === 'critical' && (rto === 0 || rpo === 0)) {
    bkStatus = 'warn';
    bkReason = `Provider ${backupProv} declarado mas RTO/RPO não medidos — processo crítico exige SLA validado.`;
  } else if (procCriticality === 'critical' && org.backupFrequency && org.backupFrequency !== 'daily' && org.backupFrequency !== 'hourly') {
    bkStatus = 'warn';
    bkReason = `Backup ${backupProv} frequência ${org.backupFrequency} pode ser insuficiente para processo crítico.`;
  } else {
    bkStatus = 'pass';
    bkReason = `Backup OK: ${backupProv} (${org.backupFrequency || 'freq n/d'}, RTO ${rto}h / RPO ${rpo}h) atende exigência.`;
  }
  filters.push({ key: 'backupDR', label: 'Backup / DR', status: bkStatus, reason: bkReason });

  // Filtro 13: Concurrent limits
  const concApi = org.concurrentApiUsagePct || 0;
  const stream = org.streamingClientsPct || 0;
  const bulk = org.bulkJobsDailyPct || 0;
  const maxConc = Math.max(concApi, stream, bulk);
  let concStatus, concReason;
  const orgConcLimit = org.concurrentApiLimit || 0;
  if (maxConc === 0) {
    concStatus = 'warn';
    concReason = `Uso de limites concorrentes (Concurrent API, Streaming, Bulk) não medido${orgConcLimit ? ` (limite absoluto ${orgConcLimit})` : ''} — processo com picos pode estourar antes de storage/daily API.`;
  } else if (maxConc >= 85) {
    concStatus = 'fail';
    concReason = `Limites concorrentes críticos: Concurrent API ${concApi}% · Streaming ${stream}% · Bulk ${bulk}%.`;
  } else if (maxConc >= 70) {
    concStatus = 'warn';
    concReason = `Limites concorrentes apertados (max ${maxConc}%): revisar antes de alocar processo com picos.`;
  } else {
    concStatus = 'pass';
    concReason = `Folga em limites concorrentes: Concurrent API ${concApi}% · Streaming ${stream}% · Bulk ${bulk}%.`;
  }
  filters.push({ key: 'concurrentLimits', label: 'Limites concorrentes', status: concStatus, reason: concReason });

  // Filtro 14: Timezone / locale
  const procTz = (proc.targetTimezone || '').trim();
  const orgTz = org.timezone;
  let tzStatus, tzReason;
  if (!procTz) {
    tzStatus = 'pass';
    tzReason = 'Processo sem exigência declarada de timezone.';
  } else if (!orgTz) {
    tzStatus = 'warn';
    tzReason = `Processo exige timezone ${procTz}; org não declara timezone — validar antes.`;
  } else if (procTz === orgTz) {
    tzStatus = 'pass';
    tzReason = `Timezone alinhado (${procTz}).`;
  } else if (procTz.toLowerCase() === 'multi' || procTz.toLowerCase() === 'global') {
    tzStatus = 'warn';
    tzReason = `Processo multi-região em org fixada em ${orgTz} — batch schedules e business hours precisam ajuste.`;
  } else {
    tzStatus = 'fail';
    tzReason = `Timezone incompatível: processo=${procTz}, org=${orgTz}. Impacto em holidays, business hours, batch windows.`;
  }
  filters.push({ key: 'timezone', label: 'Timezone / locale', status: tzStatus, reason: tzReason });

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
    tenReason = 'Processo sem dependência de tenants externos declarada.';
  } else {
    const connected = new Set((org.connectedTenants || []).map(t => t.toLowerCase()));
    const missing = procTenants.filter(t => !connected.has(t.toLowerCase()));
    if (missing.length === 0) {
      tenStatus = 'pass';
      tenReason = `Todos os tenants exigidos conectados: ${procTenants.join(', ')}.`;
    } else if (missing.length === procTenants.length) {
      tenStatus = 'fail';
      tenReason = `Nenhum tenant externo exigido (${procTenants.join(', ')}) está conectado — processo não integra.`;
    } else {
      tenStatus = 'warn';
      tenReason = `Tenants parcialmente conectados. Faltando: ${missing.join(', ')}.`;
    }
  }
  filters.push({ key: 'externalTenants', label: 'Tenants externos (MC/DC/ERP/Auth0)', status: tenStatus, reason: tenReason });

  // Filtro 16: Support tier
  const tier = (org.supportTier || '').toLowerCase();
  const tierRank = { standard: 1, premier: 2, signature: 3 };
  let supStatus, supReason;
  const requiredTier = procCriticality === 'critical' ? 'premier' : procCriticality === 'high' ? 'premier' : 'standard';
  if (!tier) {
    supStatus = procCriticality === 'critical' ? 'fail' : 'warn';
    supReason = `Support tier da org não declarado; processo criticidade=${procCriticality} exige ${requiredTier}+.`;
  } else if ((tierRank[tier] || 0) >= (tierRank[requiredTier] || 0)) {
    supStatus = 'pass';
    supReason = `Support tier ${tier} atende criticidade ${procCriticality}.`;
  } else {
    supStatus = 'fail';
    supReason = `Support tier insuficiente: org=${tier}, criticidade do processo=${procCriticality} exige ${requiredTier}+.`;
  }
  filters.push({ key: 'supportTier', label: 'Support tier Salesforce', status: supStatus, reason: supReason });

  // Filtro 17: Incidents / uptime
  const inc = org.incidentsLast12mo;
  const upt = org.uptimePct;
  let opStatus, opReason;
  if (inc == null && upt == null) {
    opStatus = 'warn';
    opReason = 'Histórico operacional (incidents, uptime) não declarado.';
  } else if ((inc != null && inc >= 5) || (upt != null && upt < 99.0)) {
    opStatus = 'fail';
    opReason = `Histórico degradado: ${inc != null ? `${inc} incidents/12mo` : 'incidents n/d'} · ${upt != null ? `uptime ${upt}%` : 'uptime n/d'}.`;
  } else if ((inc != null && inc >= 2) || (upt != null && upt < 99.5)) {
    opStatus = 'warn';
    opReason = `Histórico apertado: ${inc != null ? `${inc} incidents/12mo` : 'incidents n/d'} · ${upt != null ? `uptime ${upt}%` : 'uptime n/d'}.`;
  } else {
    opStatus = 'pass';
    opReason = `Histórico saudável: ${inc != null ? `${inc} incidents/12mo` : 'incidents n/d'} · ${upt != null ? `uptime ${upt}%` : 'uptime n/d'}.`;
  }
  filters.push({ key: 'incidents', label: 'Incidents / uptime', status: opStatus, reason: opReason });

  // Filtro 18: Documentation
  const docs = org.documentationScore;
  let docStatus, docReason;
  if (docs == null) {
    docStatus = 'warn';
    docReason = 'Score de documentação não declarado — assumir ausência encarece onboarding.';
  } else if (docs < 40) {
    docStatus = 'fail';
    docReason = `Documentação insuficiente (score ${docs}/100) — sem runbook/ADR/model docs, absorver processo novo é caro.`;
  } else if (docs < 70) {
    docStatus = 'warn';
    docReason = `Documentação parcial (score ${docs}/100). Reforçar antes de acomodar processo crítico.`;
  } else {
    docStatus = 'pass';
    docReason = `Documentação adequada (score ${docs}/100).`;
  }
  filters.push({ key: 'documentation', label: 'Documentação / runbooks', status: docStatus, reason: docReason });

  // Filtro 19: UX overhead
  const tabs = org.tabCount || 0;
  const layouts = org.layoutCount || 0;
  const rts = org.recordTypeCount || 0;
  let uxStatus, uxReason;
  if (tabs === 0 && layouts === 0 && rts === 0) {
    uxStatus = 'pass';
    uxReason = 'Sem métricas de UX overhead — assume org limpa.';
  } else if (tabs > 150 || layouts > 300 || rts > 100) {
    uxStatus = 'fail';
    uxReason = `UX degradada: ${tabs} tabs · ${layouts} layouts · ${rts} record types. Adicionar processo piora para todos os usuários.`;
  } else if (tabs > 100 || layouts > 200 || rts > 60) {
    uxStatus = 'warn';
    uxReason = `UX pesada: ${tabs} tabs · ${layouts} layouts · ${rts} record types. Cuidado ao adicionar mais.`;
  } else {
    uxStatus = 'pass';
    uxReason = `UX saudável: ${tabs} tabs · ${layouts} layouts · ${rts} record types.`;
  }
  filters.push({ key: 'uxOverhead', label: 'UX overhead', status: uxStatus, reason: uxReason });

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
    peReason = 'Processo não declara publicação/consumo de Platform Events, CDC ou uso de Pub/Sub API.';
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
      if (projPct >= 90) issues.push(`quota de eventos pós-alocação estoura (${projPct}% do daily limit; org já em ${orgPeUsage}%, processo adiciona +${addPct}pp)`);
      else if (projPct >= 70) warnings.push(`quota de eventos pós-alocação apertada (${projPct}%; org em ${orgPeUsage}%, +${addPct}pp)`);
    } else if (orgPeUsage >= 90) {
      issues.push(`org já em ${orgPeUsage}% do quota de eventos — sem folga para novo processo`);
    } else if (orgPeUsage >= 70) {
      warnings.push(`org em ${orgPeUsage}% do quota de eventos`);
    }

    // 2. High-volume PE requirement
    const wantsHvpe = procPublishes.some(e => e.dailyVolume > 100000);
    if (wantsHvpe && !orgHvpe) {
      issues.push('processo publica >100k eventos/dia mas HVPE não está habilitado na org');
    }

    // 3. Consumo de PEs não publicados
    const missingPublished = procConsumes.filter(e => !orgPublished.has(e.name.toLowerCase()));
    if (missingPublished.length > 0) {
      issues.push(`processo consome eventos que a org não publica: ${missingPublished.map(e => e.name).join(', ')}`);
    }

    // 4. CDC entities
    const missingCdc = procRequiresCdc.filter(e => !orgCdc.has(e.toLowerCase()));
    if (missingCdc.length > 0) {
      warnings.push(`CDC não habilitado para: ${missingCdc.join(', ')} (ativação exige Setup)`);
    }

    // 5. Pub/Sub API
    if (procRequiresPubSubApi && !orgPubSub) {
      issues.push('processo exige Pub/Sub API (gRPC) mas a org não tem endpoint habilitado — força CometD legado');
    }

    if (issues.length > 0) {
      peStatus = 'fail';
      peReason = issues.join(' · ');
    } else if (warnings.length > 0) {
      peStatus = 'warn';
      peReason = warnings.join(' · ');
    } else {
      const parts = [];
      if (procPublishes.length) parts.push(`publica ${procPublishes.length} PE(s), quota projetada ${projPct}%`);
      if (procConsumes.length) parts.push(`consome ${procConsumes.length} PE(s) todos disponíveis`);
      if (procRequiresCdc.length) parts.push(`CDC OK para ${procRequiresCdc.join(', ')}`);
      if (procRequiresPubSubApi) parts.push('Pub/Sub API habilitado');
      peStatus = 'pass';
      peReason = 'Event backbone alinhado: ' + parts.join(' · ') + '.';
    }
  }
  filters.push({ key: 'platformEvents', label: 'Platform Events / CDC / Pub-Sub API', status: peStatus, reason: peReason });

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
    teamReason = 'Team capacity não declarada — reuso pode encontrar time no limite.';
  } else {
    const missingSkills = requiredSkills.filter(s => !skills.has(s.toLowerCase()));
    if (util >= 90 || (requiredHc > 0 && hc < requiredHc)) {
      teamStatus = 'fail';
      teamReason = `Team saturado: ${hc} FTE @ ${util}% util${requiredHc ? `; processo exige ${requiredHc} FTE dedicados` : ''}.`;
    } else if (util >= 75 || missingSkills.length > 0) {
      teamStatus = 'warn';
      teamReason = `Team apertado: ${util}% util${missingSkills.length ? ` · faltam skills: ${missingSkills.join(', ')}` : ''}.`;
    } else {
      teamStatus = 'pass';
      teamReason = `Team folgado: ${hc} FTE @ ${util}% util${requiredSkills.length ? ` · skills OK` : ''}.`;
    }
  }
  filters.push({ key: 'teamCapacity', label: 'Team capacity / skills', status: teamStatus, reason: teamReason });

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
    mdmReason = 'Processo não declara entidades de master data.';
  } else if (!procMdmRole) {
    mdmStatus = 'warn';
    mdmReason = `Processo declara master data (${procTouchesMdmEntities.join(', ')}) mas não define papel (owner/consumer) — risco de duplicação.`;
  } else if (procMdmRole === 'owner') {
    const conflict = procTouchesMdmEntities.filter(e => owner.has(e.toLowerCase()) === false);
    if (conflict.length > 0 && procTouchesMdmEntities.some(e => consumer.has(e.toLowerCase()))) {
      mdmStatus = 'fail';
      mdmReason = `Processo quer ser owner de ${conflict.join(', ')} mas org é consumer — introduziria golden record duplicado.`;
    } else if (conflict.length > 0) {
      mdmStatus = 'warn';
      mdmReason = `Org ainda não é ownership para ${conflict.join(', ')} — validar transição de source of truth.`;
    } else {
      mdmStatus = 'pass';
      mdmReason = `Org já é owner de ${procTouchesMdmEntities.join(', ')}.`;
    }
  } else if (procMdmRole === 'consumer') {
    const notConsumer = procTouchesMdmEntities.filter(e => !consumer.has(e.toLowerCase()));
    if (notConsumer.length === procTouchesMdmEntities.length) {
      mdmStatus = 'fail';
      mdmReason = `Processo é consumer de ${procTouchesMdmEntities.join(', ')} mas org não está declarada como consumer — provável fonte errada.`;
    } else if (notConsumer.length > 0) {
      mdmStatus = 'warn';
      mdmReason = `Consumo parcial de master data: ${notConsumer.join(', ')} não declarados na org.`;
    } else {
      mdmStatus = 'pass';
      mdmReason = `Consumo de master data alinhado: ${procTouchesMdmEntities.join(', ')}.`;
    }
  } else {
    mdmStatus = 'warn';
    mdmReason = `Papel MDM "${procMdmRole}" não reconhecido.`;
  }
  filters.push({ key: 'mdmOwnership', label: 'Master data ownership', status: mdmStatus, reason: mdmReason });

  // ============================================================
  // Filtro 23: peakVsSustained — pico vs. média
  // ============================================================
  const peakApiPerSec = numParse(proc.peakApiPerSec);
  const peakEventsPerSec = numParse(proc.peakEventsPerSec);
  let peakStatus, peakReason;
  if (peakApiPerSec === 0 && peakEventsPerSec === 0) {
    peakStatus = 'warn';
    peakReason = 'Picos por segundo não estimados — motor só valida média diária, processo de burst pode estourar Concurrent limits.';
  } else {
    const concurrentApiHead = 100 - (org.concurrentApiUsagePct || 0);
    const streamingHead = 100 - (org.streamingClientsPct || 0);
    const projConcApi = (org.concurrentApiUsagePct || 0) + (peakApiPerSec > 25 ? 40 : peakApiPerSec > 10 ? 20 : 5);
    const projStream = (org.streamingClientsPct || 0) + (peakEventsPerSec > 100 ? 40 : peakEventsPerSec > 25 ? 20 : 5);
    const maxProj = Math.max(projConcApi, projStream);
    if (maxProj >= 90) {
      peakStatus = 'fail';
      peakReason = `Pico projetado estoura: Concurrent API ${projConcApi}%, Streaming ${projStream}% (peaks: ${peakApiPerSec}req/s, ${peakEventsPerSec} evt/s).`;
    } else if (maxProj >= 70) {
      peakStatus = 'warn';
      peakReason = `Pico projetado apertado: ${maxProj}% do limite concorrente — margem estreita.`;
    } else {
      peakStatus = 'pass';
      peakReason = `Picos absorvem: Concurrent API ${projConcApi}%, Streaming ${projStream}%.`;
    }
  }
  filters.push({ key: 'peakVsSustained', label: 'Pico vs. sustentado', status: peakStatus, reason: peakReason });

  // ============================================================
  // Filtro 24: featureCombos — dependências transitivas
  // ============================================================
  const procFeatures = new Set(proc.features || []);
  const combos = [];
  if (procFeatures.has('dataCloud') && procFeatures.has('agentforce')) {
    if (!(org.dataCloudEnabled && org.agentforceEnabled)) {
      combos.push({ sev: 'fail', msg: 'Data Cloud + Agentforce exige ambos ativos e mapeamento de identidade compartilhado.' });
    } else if (!org.experienceCloudEnabled) {
      combos.push({ sev: 'warn', msg: 'Data Cloud + Agentforce tipicamente exige Experience Cloud para surfacing — não habilitado.' });
    }
  }
  if (procFeatures.has('shield') && procFeatures.has('fat')) {
    if (!(org.shieldEnabled && org.fatEnabled)) {
      combos.push({ sev: 'fail', msg: 'Shield + FAT exige ambos ativos e key management coordenado.' });
    }
  }
  if (procFeatures.has('experienceCloud') && procFeatures.has('shield') && !org.shieldEnabled) {
    combos.push({ sev: 'warn', msg: 'Experience Cloud com dados criptografados por Shield exige policy tuning específica.' });
  }
  let comboStatus, comboReason;
  if (combos.length === 0) {
    comboStatus = 'pass';
    comboReason = 'Nenhum combo de features com dependência transitiva conhecida.';
  } else if (combos.some(c => c.sev === 'fail')) {
    comboStatus = 'fail';
    comboReason = combos.map(c => c.msg).join(' · ');
  } else {
    comboStatus = 'warn';
    comboReason = combos.map(c => c.msg).join(' · ');
  }
  filters.push({ key: 'featureCombos', label: 'Combos de features', status: comboStatus, reason: comboReason });

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
    dataCloud:       { base: 12000, deps: ['identity'], depNote: 'Data Cloud tipicamente exige Identity para unificação de perfis' },
    agentforce:      { base: 8000,  deps: ['dataCloud','einsteinPlatform'], depNote: 'Agentforce depende de Data Cloud + Einstein Platform (credit-based)' },
    shield:          { base: 6000,  deps: [], depNote: null },
    fat:             { base: 3000,  deps: ['shield'], depNote: 'FAT tipicamente compra-se com Shield' },
    eventMonitoring: { base: 4000,  deps: [], depNote: null },
    experienceCloud: { base: 5000,  deps: [], depNote: null },
    multiCurrency:   { base: 0,     deps: [], depNote: 'Multi-Currency é feature, não SKU — mas irreversível' }
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
      cascade.chain.push({ sku: dep, monthly: depCost, note: c.depNote });
    }
  }

  let costStatus, costReason;
  if (procUsersNew === 0 && procMonthlyBudget === 0) {
    costStatus = 'warn';
    costReason = `Run-cost recorrente não estimado (users novos, budget mensal). Podem escalar licenças sem visibilidade${cascade.addedMonthly > 0 ? `; cascade estimado US$${cascade.addedMonthly.toLocaleString()}/mês em ${cascade.chain.map(c=>c.sku).join(', ')}` : ''}.`;
  } else {
    const projMonthly = procUsersNew * costPU + addonCost + cascade.addedMonthly;
    const cascadeStr = cascade.addedMonthly > 0
      ? ` (inclui cascade de add-ons +US$${cascade.addedMonthly.toLocaleString()}/mês em ${cascade.chain.map(c=>c.sku).join(', ')})`
      : '';
    if (procMonthlyBudget > 0 && projMonthly > procMonthlyBudget * 1.5) {
      costStatus = 'fail';
      costReason = `Custo mensal projetado US$${projMonthly.toLocaleString()} excede 150% do budget (US$${procMonthlyBudget.toLocaleString()})${cascadeStr}.`;
    } else if (procMonthlyBudget > 0 && projMonthly > procMonthlyBudget) {
      costStatus = 'warn';
      costReason = `Custo mensal projetado US$${projMonthly.toLocaleString()} estoura budget (US$${procMonthlyBudget.toLocaleString()})${cascadeStr} — validar contratação.`;
    } else {
      costStatus = 'pass';
      costReason = `Custo mensal projetado US$${projMonthly.toLocaleString()} dentro do budget${cascadeStr}.`;
    }
  }
  filters.push({ key: 'runCostRecurring', label: 'Run-cost recorrente (com cascade)', status: costStatus, reason: costReason, cascade });

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
    sessReason = 'Processo não usa long-running/@future/Queueable e org sem sinais de saturação.';
  } else {
    const issues = [];
    const warns = [];
    if (procUsesLongRunning && clr >= 80) issues.push(`Concurrent long-running em ${clr}% (limite 10)`);
    else if (procUsesLongRunning && clr >= 60) warns.push(`Concurrent long-running em ${clr}%`);
    if (procUsesFuture && fqp >= 80) issues.push(`@future queue em ${fqp}%`);
    else if (procUsesFuture && fqp >= 60) warns.push(`@future queue em ${fqp}%`);
    if (procUsesQueueable && qdepth >= 5) issues.push(`Queueable chain depth ${qdepth} (limite 5 em prod)`);
    else if (procUsesQueueable && qdepth >= 3) warns.push(`Queueable chain depth ${qdepth}`);
    if (issues.length) { sessStatus = 'fail'; sessReason = issues.join(' · '); }
    else if (warns.length) { sessStatus = 'warn'; sessReason = warns.join(' · '); }
    else { sessStatus = 'pass'; sessReason = `Session concurrency OK (long-running ${clr}%, @future ${fqp}%, queueable depth ${qdepth}).`; }
  }
  filters.push({ key: 'sessionConcurrency', label: 'Session concurrency (long-running/@future/Queueable)', status: sessStatus, reason: sessReason });

  // ============================================================
  // Filtro 27: interOrgLatency — medida P95 entre orgs
  // ============================================================
  const procMaxLatencyMs = numParse(proc.maxInterOrgLatencyMs);
  let latStatus, latReason;
  const procIntegOrgs = (proc.integratesWithOrgs || '').split(',').map(s => s.trim()).filter(Boolean);
  if (procIntegOrgs.length === 0 || procMaxLatencyMs === 0) {
    latStatus = 'pass';
    latReason = 'Sem exigência de latência inter-org declarada.';
  } else {
    const measurements = org.interOrgLatencyMsP95 || {};
    const missing = procIntegOrgs.filter(o => measurements[o] == null);
    const violating = procIntegOrgs.filter(o => measurements[o] != null && measurements[o] > procMaxLatencyMs);
    if (missing.length === procIntegOrgs.length) {
      latStatus = 'warn';
      latReason = `Latência inter-org não medida para ${procIntegOrgs.join(', ')} — validar antes.`;
    } else if (violating.length > 0) {
      latStatus = 'fail';
      const detail = violating.map(o => `${o}=${measurements[o]}ms`).join(', ');
      latReason = `Latência viola SLA (${procMaxLatencyMs}ms): ${detail}.`;
    } else if (missing.length > 0) {
      latStatus = 'warn';
      latReason = `Latência OK para ${procIntegOrgs.filter(o => !missing.includes(o)).join(', ')}, faltando medir: ${missing.join(', ')}.`;
    } else {
      latStatus = 'pass';
      const detail = procIntegOrgs.map(o => `${o}=${measurements[o]}ms`).join(', ');
      latReason = `Latência P95 dentro do SLA: ${detail} ≤ ${procMaxLatencyMs}ms.`;
    }
  }
  filters.push({ key: 'interOrgLatency', label: 'Latência inter-org medida', status: latStatus, reason: latReason });

  // ============================================================
  // Filtro 28: sharingModelFit
  // ============================================================
  const procSharing = (proc.requiredSharingModel || '').toLowerCase();
  const orgSharing = (org.sharingModel || '').toLowerCase();
  const orgRoleDepth = org.roleHierarchyDepth || 0;
  let shStatus, shReason;
  if (!procSharing) {
    shStatus = 'pass';
    shReason = 'Processo sem exigência específica de sharing model.';
  } else if (!orgSharing) {
    shStatus = 'warn';
    shReason = `Processo pede sharing "${procSharing}" mas org não declara modelo.`;
  } else if (procSharing === orgSharing) {
    if (orgRoleDepth > 8) {
      shStatus = 'warn';
      shReason = `Sharing model ${orgSharing} alinhado, mas role hierarchy profunda (${orgRoleDepth} níveis) degrada performance.`;
    } else {
      shStatus = 'pass';
      shReason = `Sharing model ${orgSharing} alinhado (role depth ${orgRoleDepth}).`;
    }
  } else if ((procSharing === 'private' && orgSharing === 'public') || (procSharing === 'public' && orgSharing === 'private')) {
    shStatus = 'fail';
    shReason = `Sharing incompatível: processo pede ${procSharing}, org é ${orgSharing}.`;
  } else {
    shStatus = 'warn';
    shReason = `Sharing model divergente: processo ${procSharing}, org ${orgSharing} — validar impacto.`;
  }
  filters.push({ key: 'sharingModelFit', label: 'Sharing model fit', status: shStatus, reason: shReason });

  // ============================================================
  // Filtro 29: licenseContention — usuário do processo cabe?
  // ============================================================
  const procLicense = (proc.userLicenseRequired || '').trim();
  const availLic = org.availableLicenses || {};
  let licStatus, licReason;
  if (!procLicense) {
    licStatus = 'pass';
    licReason = 'Processo não exige tipo de licença específico.';
  } else {
    const availCount = availLic[procLicense];
    if (availCount == null) {
      licStatus = 'warn';
      licReason = `Licenças "${procLicense}" não inventariadas — validar disponibilidade antes.`;
    } else if (availCount === 0) {
      licStatus = 'fail';
      licReason = `Zero licenças "${procLicense}" disponíveis — precisa comprar antes de alocar.`;
    } else if (procUsersNew > availCount) {
      licStatus = 'fail';
      licReason = `Processo exige ${procUsersNew} licenças "${procLicense}", org tem ${availCount} — deficit.`;
    } else if (procUsersNew > availCount * 0.75) {
      licStatus = 'warn';
      licReason = `Processo consome ${procUsersNew} de ${availCount} licenças "${procLicense}" — pouca folga.`;
    } else {
      licStatus = 'pass';
      licReason = `Licenças "${procLicense}" com folga: ${availCount} disponíveis, processo pede ${procUsersNew}.`;
    }
  }
  filters.push({ key: 'licenseContention', label: 'Contenção de licenças', status: licStatus, reason: licReason });

  // ============================================================
  // Filtro 30: historicalVelocity — cadência real vs. planejada
  // ============================================================
  const cadenceDays = { weekly: 7, biweekly: 14, monthly: 30, quarterly: 90 };
  const procCadDays = cadenceDays[proc.cadence] || 30;
  const lead = org.releaseLeadTimeDays || 0;
  let velStatus, velReason;
  if (lead === 0) {
    velStatus = 'warn';
    velReason = 'Lead-time real de release não medido — cadência declarada pode ser aspiracional.';
  } else if (lead > procCadDays * 1.5) {
    velStatus = 'fail';
    velReason = `Lead-time real ${lead} dias >> cadência exigida ${procCadDays} dias — org não entrega no ritmo do processo.`;
  } else if (lead > procCadDays) {
    velStatus = 'warn';
    velReason = `Lead-time real ${lead}d ligeiramente acima da cadência ${procCadDays}d — investigar gargalo.`;
  } else {
    velStatus = 'pass';
    velReason = `Lead-time real ${lead}d cabe na cadência ${procCadDays}d.`;
  }
  filters.push({ key: 'historicalVelocity', label: 'Velocidade real de release', status: velStatus, reason: velReason });

  // ============================================================
  // Filtro 31: testDataMask — LGPD em sandbox
  // ============================================================
  const procNeedsMask = proc.requiresDataMasking === true || proc.requiresDataMasking === 'true';
  let maskStatus, maskReason;
  if (!procNeedsMask) {
    maskStatus = 'pass';
    maskReason = 'Processo não exige anonimização em sandbox.';
  } else if (!org.dataMaskEnabled) {
    maskStatus = 'fail';
    maskReason = 'Processo LGPD-sensível exige Data Mask; org não tem habilitado — sandbox Full Copy com PII vira risco.';
  } else {
    maskStatus = 'pass';
    maskReason = 'Data Mask habilitado — dados sensíveis anonimizados em sandbox.';
  }
  filters.push({ key: 'testDataMask', label: 'Test data masking (LGPD)', status: maskStatus, reason: maskReason });

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
    langReason = 'Processo não exige suporte multi-idioma.';
  } else {
    const missing = procLangs.filter(l => !orgLangs.has(l.toLowerCase()));
    if (missing.length === procLangs.length) {
      langStatus = 'fail';
      langReason = `Nenhum idioma exigido (${procLangs.join(', ')}) ativo — translation workbench precisa configuração completa.`;
    } else if (missing.length > 0) {
      langStatus = 'warn';
      langReason = `Idiomas parciais. Faltando: ${missing.join(', ')}.`;
    } else {
      langStatus = 'pass';
      langReason = `Idiomas ativos: ${procLangs.join(', ')}.`;
    }
  }
  filters.push({ key: 'multiLanguage', label: 'Multi-idioma', status: langStatus, reason: langReason });

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
      pvIssues.push(`package "${ns}" não instalado (versão exigida ${minV})`);
    } else if (!pkg.version) {
      pvWarns.push(`package "${ns}" instalado mas versão não declarada`);
    } else if (compareVersion(pkg.version, minV) < 0) {
      pvIssues.push(`package "${ns}" versão ${pkg.version} < exigida ${minV}`);
    }
  }
  if (Object.keys(procPkgVersionReq).length === 0) {
    pvStatus = 'pass'; pvReason = 'Sem exigência de versão mínima de package.';
  } else if (pvIssues.length) {
    pvStatus = 'fail'; pvReason = pvIssues.join(' · ');
  } else if (pvWarns.length) {
    pvStatus = 'warn'; pvReason = pvWarns.join(' · ');
  } else {
    pvStatus = 'pass'; pvReason = `Versões de package OK: ${Object.keys(procPkgVersionReq).join(', ')}.`;
  }
  filters.push({ key: 'packageVersion', label: 'Versão mínima de packages', status: pvStatus, reason: pvReason });

  // ============================================================
  // Filtro 34: retentionPolicy — Field History / Big Objects
  // ============================================================
  const procRetMonths = numParse(proc.requiredFieldHistoryMonths);
  const procNeedsBigObjects = proc.requiresBigObjects === true || proc.requiresBigObjects === 'true';
  const orgRetMonths = org.fieldHistoryRetentionMonths || 0;
  let retStatus, retReason;
  if (procRetMonths === 0 && !procNeedsBigObjects) {
    retStatus = 'pass';
    retReason = 'Processo sem exigência específica de retenção.';
  } else {
    const issues = [];
    if (procRetMonths > 0 && orgRetMonths < procRetMonths) {
      issues.push(`Field History retenção ${orgRetMonths} meses < exigido ${procRetMonths}`);
    }
    if (procNeedsBigObjects && !org.bigObjectsEnabled) {
      issues.push('Big Objects necessários para arquivamento não habilitados');
    }
    if (issues.length === 0) {
      retStatus = 'pass';
      retReason = `Retenção OK: FH ${orgRetMonths} meses · Big Objects ${org.bigObjectsEnabled ? 'on' : 'n/a'}.`;
    } else if (procRetMonths > 0 && orgRetMonths >= procRetMonths / 2) {
      retStatus = 'warn';
      retReason = issues.join(' · ') + ' — parcial, ativação/upgrade viável.';
    } else {
      retStatus = 'fail';
      retReason = issues.join(' · ');
    }
  }
  filters.push({ key: 'retentionPolicy', label: 'Política de retenção', status: retStatus, reason: retReason });

  // ============================================================
  // Filtro 35: marketingConsent — preference center unificado
  // ============================================================
  const procNeedsConsent = proc.requiresConsentFramework === true || proc.requiresConsentFramework === 'true';
  let consStatus, consReason;
  if (!procNeedsConsent) {
    consStatus = 'pass';
    consReason = 'Processo não requer consent framework.';
  } else if (!org.consentFramework) {
    consStatus = 'fail';
    consReason = 'Processo é opt-in mas org não declara consent framework — risco LGPD/GDPR.';
  } else {
    consStatus = 'pass';
    consReason = `Consent framework ativo: ${org.consentFramework}.`;
  }
  filters.push({ key: 'marketingConsent', label: 'Consent / preference center', status: consStatus, reason: consReason });

  // ============================================================
  // Filtro 36: finopsObservability
  // ============================================================
  const procHighConsumption = proc.hasHighConsumption === true || proc.hasHighConsumption === 'true';
  let finStatus, finReason;
  if (!procHighConsumption) {
    finStatus = 'pass';
    finReason = 'Processo não sinalizado como alto-consumo — observability opcional.';
  } else if (!org.finopsObservability) {
    finStatus = 'fail';
    finReason = 'Processo alto-consumo em org sem FinOps observability — surprise bill esperado.';
  } else {
    finStatus = 'pass';
    finReason = 'FinOps observability ativa para monitorar consumo.';
  }
  filters.push({ key: 'finopsObservability', label: 'FinOps observability', status: finStatus, reason: finReason });

  // ============================================================
  // Filtro 37: sandboxCoordination — refresh coordenado
  // ============================================================
  const procNeedsCoordinated = proc.requiresCoordinatedSandbox === true || proc.requiresCoordinatedSandbox === 'true';
  let sbcStatus, sbcReason;
  if (!procNeedsCoordinated) {
    sbcStatus = 'pass';
    sbcReason = 'Processo não exige refresh coordenado entre sandboxes.';
  } else if (!org.sandboxRefreshCoordinated) {
    sbcStatus = 'fail';
    sbcReason = 'Processo depende de sandbox inter-org coordenado; refresh não é coordenado hoje — CDC/PE subscriber ficará dessincronizado.';
  } else {
    sbcStatus = 'pass';
    sbcReason = 'Refresh de sandbox coordenado — inter-org staging alinhado.';
  }
  filters.push({ key: 'sandboxCoordination', label: 'Coordenação de sandbox', status: sbcStatus, reason: sbcReason });

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
    vcReason = 'Processo não depende de contratos de vendor específicos.';
  } else {
    const risky = procDependsVendors.filter(v => expiring.has(v.toLowerCase()));
    if (risky.length === procDependsVendors.length) {
      vcStatus = 'fail';
      vcReason = `Todos os vendors críticos (${risky.join(', ')}) têm contrato expirando — alocação depende de renovação.`;
    } else if (risky.length > 0) {
      vcStatus = 'warn';
      vcReason = `Contratos expirando: ${risky.join(', ')} — validar renovação antes de comprometer.`;
    } else {
      vcStatus = 'pass';
      vcReason = `Vendors dependentes com contrato vigente: ${procDependsVendors.join(', ')}.`;
    }
  }
  filters.push({ key: 'vendorContract', label: 'Contratos de vendor', status: vcStatus, reason: vcReason });

  // ============================================================
  // Filtro 39: envStrategy — canary/feature flag conflict
  // ============================================================
  const procUsesCanary = proc.requiresCanaryRelease === true || proc.requiresCanaryRelease === 'true';
  const orgEnv = (org.envStrategy || '').toLowerCase();
  let envStatus, envReason;
  if (!procUsesCanary) {
    envStatus = 'pass';
    envReason = 'Processo sem exigência de canary/feature-flag.';
  } else if (!orgEnv) {
    envStatus = 'warn';
    envReason = 'Processo exige canary release; estratégia de ambiente da org não declarada.';
  } else if (orgEnv === 'prod-only' || orgEnv === 'bigbang') {
    envStatus = 'fail';
    envReason = `Org é "${orgEnv}"; processo exige canary — sem staging + rollout controlado.`;
  } else {
    envStatus = 'pass';
    envReason = `Env strategy compatível: ${orgEnv}.`;
  }
  filters.push({ key: 'envStrategy', label: 'Environment strategy', status: envStatus, reason: envReason });

  // ============================================================
  // Filtro 40: growthTrend — degradação projetada 12mo
  // ============================================================
  const growth = org.storageGrowthPctPerMonth || 0;
  let grStatus, grReason;
  if (growth === 0) {
    grStatus = 'warn';
    grReason = 'Crescimento mensal de storage não medido — impossível projetar 12mo.';
  } else {
    const proj12mo = (org.storagePct || 0) + growth * 12;
    if (proj12mo >= 100) {
      grStatus = 'fail';
      grReason = `Sem alocar o processo, storage estoura em <12mo (proj ${Math.round(proj12mo)}% em 12mo · crescimento ${growth}%/mês).`;
    } else if (proj12mo >= 85) {
      grStatus = 'warn';
      grReason = `Crescimento coloca org perto do teto em 12mo (proj ${Math.round(proj12mo)}%).`;
    } else {
      grStatus = 'pass';
      grReason = `Crescimento sustentável: proj ${Math.round(proj12mo)}% em 12mo.`;
    }
  }
  filters.push({ key: 'growthTrend', label: 'Tendência de crescimento (12mo)', status: grStatus, reason: grReason });

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
  const detail = `cf ${org.customFieldCount||0} · apex ${org.apexClassCount||0} · roles ${org.userRoleCount||0} · sharing ${org.sharingRuleCount||0} · territory ${org.territoryModelCount||0} · permsets ${org.permSetCount||0} · triggers ${org.triggerCount||0} · flows ${org.flowCount||0}`;
  if (complexityScore >= 8) {
    complexityStatus = 'fail';
    complexityReason = `Metadata complexity elevada (score ${complexityScore}): ${detail}. Refactor obrigatório antes de acomodar novo processo.`;
  } else if (complexityScore >= 4) {
    complexityStatus = 'warn';
    complexityReason = `Metadata complexity moderada (score ${complexityScore}): ${detail}. Cuidado ao adicionar mais.`;
  } else {
    complexityStatus = 'pass';
    complexityReason = `Metadata complexity saudável (score ${complexityScore}): ${detail}.`;
  }
  filters.push({ key: 'metadataComplexity', label: 'Complexidade de metadata', status: complexityStatus, reason: complexityReason });

  // ============================================================
  // Filtro 42: adminHygiene — Modify All Data espalhado
  // ============================================================
  const mad = org.modifyAllPermSets || 0;
  const madU = org.modifyAllUserCount || 0;
  let adminStatus, adminReason;
  if (mad === 0 && madU === 0) {
    adminStatus = 'warn';
    adminReason = 'Hygiene de admin não medida — validar quantos permsets/users têm ModifyAllData.';
  } else if (mad > 10 || madU > 30) {
    adminStatus = 'fail';
    adminReason = `Modify All Data espalhado: ${mad} permsets · ${madU} users. Segregation of duties comprometida — refactor antes de acomodar processo SOX/PCI.`;
  } else if (mad > 5 || madU > 15) {
    adminStatus = 'warn';
    adminReason = `Modify All Data com espalhamento moderado: ${mad} permsets · ${madU} users.`;
  } else {
    adminStatus = 'pass';
    adminReason = `Modify All Data controlado: ${mad} permsets · ${madU} users.`;
  }
  filters.push({ key: 'adminHygiene', label: 'Hygiene de admin (ModifyAllData)', status: adminStatus, reason: adminReason });

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
          rationale: `mesmo regulador (${a.regulator}), mesmo data controller e mesmo data model (${a.dataModel}); capacidade agregada storage ${combinedStoragePct}% / API ${combinedApiPct}% / objs ${combinedObjPct}% — cabem em uma`,
          savingsEstimate: `elimina 1 Full Copy, 1 Shield replicado, ~US$${(a.addonRunCostMonthly || 5000).toLocaleString()}/mês`
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
        rationale: `${heavy.orgName} está apertada (storage ${heavy.storagePct||0}% / API ${heavy.apiUsagePct||0}% / PE ${heavy.platformEventUsagePct||0}%); ${compatibleLight.orgName} tem folga e é compatível — considere migrar processos antes de alocar o novo`
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
      criterion: 'regulator inédito',
      detail: `Nenhuma org do landscape opera sob ${proc.regulator}. Alocar num regulator diferente contamina perímetro de compliance.`
    });
  }
  if (proc.dataController === 'DIFFERENT') {
    newOrgRationale.push({
      criterion: 'data controller distinto',
      detail: 'Data controller diferente sem contrato inter-partes viola LGPD. Nova org é o único caminho compliant.'
    });
  }
  if (proc.dataModel === 'personAccount' && !orgs.some(o => o.hasPersonAccount)) {
    newOrgRationale.push({
      criterion: 'Person Account inédito',
      detail: 'Nenhuma org do landscape tem Person Account. Habilitar em org existente é decisão irreversível — pode conflitar com processos B2B já presentes.'
    });
  }
  if (procCrit === 'critical' && passing.length === 0 && warning.filter(w => w.warnCount <= 3).length === 0) {
    newOrgRationale.push({
      criterion: 'processo crítico + landscape saturado',
      detail: 'Criticalidade crítica e nenhuma org do landscape suporta com <3 warnings. Custo de acomodar em org existente pode ser maior que o custo de nova org com plano de sunset.'
    });
  }

  // 4. Recomendação síntese
  let recommendation, primaryChoice, summary;
  if (newOrgRationale.length > 0) {
    recommendation = 'new-org';
    primaryChoice = null;
    summary = `Nova org é a escolha correta — não como fallback, mas por critério estruturado: ${newOrgRationale.map(r => r.criterion).join(', ')}.`;
  } else if (consolidations.length > 0 && passing.length === 0) {
    recommendation = 'consolidate-first';
    primaryChoice = consolidations[0].orgs;
    summary = `Antes de alocar o processo, consolide ${consolidations[0].orgs.join(' + ')} — cabem numa só e liberam custo/capacidade. Depois reavalie.`;
  } else if (passing.length > 0) {
    recommendation = 'reuse';
    primaryChoice = passing[0].org.orgName;
    summary = `Aloque em ${passing[0].org.orgName} — passa em todos os filtros com score ${passing[0].score}${passing.length > 1 ? `; ${passing.length - 1} alternativa(s) elegível(is)` : ''}.`;
  } else if (warning.length > 0) {
    recommendation = 'reuse-with-warnings';
    primaryChoice = warning[0].org.orgName;
    summary = `Nenhuma org passa 100%. Melhor candidata: ${warning[0].org.orgName} (${warning[0].warnCount} warnings). Resolva warnings ou considere alternativas técnicas.`;
  } else {
    recommendation = 'no-viable-option';
    primaryChoice = null;
    summary = 'Todas as candidatas têm bloqueadores hard. Exaure alternativas técnicas (Data Cloud, 2GP, Experience Cloud, MuleSoft, shared services) antes de criar nova org.';
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
