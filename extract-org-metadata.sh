#!/usr/bin/env bash
# Extrai metadata de uma org Salesforce no formato consumido por
# salesforce-org-strategy-questionnaire.html (motor allocation-engine.mjs).
#
# Uso:
#   ./extract-org-metadata.sh <org-alias> [output.json]
#
# Requisitos: sf CLI logado (sf org login web -a <alias>), jq
#
# O script coleta o que é extraível por API/CLI. Campos que só o humano/PMO
# sabe (regulator, LGPD data controller, LOB, ApexGuru, MDM, contratos,
# backup, sandbox, custo, incidents) devem ser fornecidos num arquivo
# <alias>.manual.json ao lado — ele é fundido no output final.
#
# Multi-org: rode uma vez por org, gerando N arquivos JSON.
# Depois faça upload de todos no card "Carregar metadata" do questionário.

set -uo pipefail

ALIAS="${1:?uso: $0 <org-alias> [output.json]}"
OUT="${2:-${ALIAS}-metadata.json}"

command -v jq >/dev/null || { echo "erro: instale jq (brew install jq)"; exit 1; }
command -v sf >/dev/null || { echo "erro: sf CLI não encontrado"; exit 1; }

if ! sf org display --target-org "$ALIAS" --json >/dev/null 2>&1; then
  echo "erro: alias '$ALIAS' não encontrado. Rode: sf org login web -a $ALIAS" >&2
  exit 1
fi

echo "→ Extraindo metadata de '$ALIAS' (pode levar alguns minutos em orgs grandes)..." >&2

step() { echo "  · $1..." >&2; }

# --- helpers resilientes ---
qcount() {
  local q="$1"
  local out
  out=$(sf data query --target-org "$ALIAS" --query "$q" --json 2>/dev/null | jq -r '.result.totalSize // 0' 2>/dev/null)
  [[ "$out" =~ ^[0-9]+$ ]] && echo "$out" || echo 0
}

qcount_tooling() {
  local q="$1"
  local out
  out=$(sf data query --target-org "$ALIAS" --use-tooling-api --query "$q" --json 2>/dev/null | jq -r '.result.totalSize // 0' 2>/dev/null)
  [[ "$out" =~ ^[0-9]+$ ]] && echo "$out" || echo 0
}

meta_count() {
  local type="$1"
  local out
  out=$(sf org list metadata --target-org "$ALIAS" --metadata-type "$type" --json 2>/dev/null | jq -r '(.result // []) | length' 2>/dev/null)
  [[ "$out" =~ ^[0-9]+$ ]] && echo "$out" || echo 0
}

safe_bool() { case "$1" in true|false) echo "$1" ;; *) echo false ;; esac; }

# --- coleta ---
step "identificação"
ORG_JSON=$(sf org display --target-org "$ALIAS" --json 2>/dev/null || echo '{}')
ORG_NAME=$(echo "$ORG_JSON" | jq -r '.result.alias // .result.username // empty')
[[ -z "$ORG_NAME" ]] && ORG_NAME="$ALIAS"
EDITION=$(echo "$ORG_JSON" | jq -r '.result.edition // "unknown"')
INSTANCE_URL=$(echo "$ORG_JSON" | jq -r '.result.instanceUrl // empty')
POD_REGION=$(echo "$INSTANCE_URL" | grep -oE '[A-Z]{2}[0-9]+' | head -1 || echo "")
[[ -z "$POD_REGION" ]] && POD_REGION="unknown"

step "Organization (Multi-Currency, timezone, locale, languages)"
ORG_INFO=$(sf data query --target-org "$ALIAS" \
  --query "SELECT IsMultiCurrencyOrganization,LanguageLocaleKey,TimeZoneSidKey FROM Organization LIMIT 1" \
  --json 2>/dev/null | jq -r '.result.records[0] // {}')
IS_MC=$(safe_bool "$(echo "$ORG_INFO" | jq -r '.IsMultiCurrencyOrganization // false')")
TIMEZONE=$(echo "$ORG_INFO" | jq -r '.TimeZoneSidKey // "unknown"')
LOCALE=$(echo "$ORG_INFO" | jq -r '.LanguageLocaleKey // "unknown"')

step "active languages"
ACTIVE_LANGS=$(sf data query --target-org "$ALIAS" \
  --query "SELECT LanguageLocaleKey FROM UserPreference WHERE Preference='LanguageLocaleKey' GROUP BY LanguageLocaleKey" \
  --json 2>/dev/null | jq -c '[.result.records[]?.LanguageLocaleKey] | unique' 2>/dev/null)
[[ -z "$ACTIVE_LANGS" || "$ACTIVE_LANGS" == "null" ]] && ACTIVE_LANGS="[]"

step "Person Account"
HAS_PA=$(safe_bool "$(sf sobject describe --target-org "$ALIAS" --sobject Account --json 2>/dev/null \
  | jq -r 'if ([.result.fields[]? | select(.name=="IsPersonAccount")] | length) > 0 then "true" else "false" end')")

step "metadata counts"
CUSTOM_OBJ=$(meta_count CustomObject)
CUSTOM_FIELD=$(meta_count CustomField)
APEX_CLASS=$(meta_count ApexClass)
TRIGGERS=$(meta_count ApexTrigger)
FLOWS=$(meta_count Flow)
PERMSETS=$(meta_count PermissionSet)
SHARING_RULE=$(meta_count SharingRules)

step "user roles / territory"
ROLES=$(qcount "SELECT Id FROM UserRole")
TERR=$(qcount "SELECT Id FROM Territory2Model")

step "sharing model (Account default org-wide)"
ACC_SHARING=$(sf sobject describe --target-org "$ALIAS" --sobject Account --json 2>/dev/null \
  | jq -r '.result.defaultAccessLevel // "unknown"' 2>/dev/null | tr '[:upper:]' '[:lower:]')
[[ -z "$ACC_SHARING" || "$ACC_SHARING" == "null" ]] && ACC_SHARING="unknown"

step "role hierarchy depth"
# Fetch (id, parent) para todas as roles e computa profundidade por DFS no jq.
# A profundidade de uma role = nº de ancestrais até chegar em null (root).
ROLES_TREE=$(sf data query --target-org "$ALIAS" \
  --query "SELECT Id, ParentRoleId FROM UserRole" --json 2>/dev/null \
  | jq -c '[.result.records[]? | {id: .Id, parent: .ParentRoleId}]' 2>/dev/null)
if [[ -z "$ROLES_TREE" || "$ROLES_TREE" == "null" || "$ROLES_TREE" == "[]" ]]; then
  ROLE_DEPTH=0
else
  ROLE_DEPTH=$(echo "$ROLES_TREE" | jq '
    . as $roles
    | ($roles | map({key: .id, value: .parent}) | from_entries) as $m
    | $roles | map([.parent | while(. != null; $m[.])] | length) | max // 0
  ' 2>/dev/null)
fi
[[ "$ROLE_DEPTH" =~ ^[0-9]+$ ]] || ROLE_DEPTH=0

step "add-ons via PermissionSetLicense"
LICENSES=$(sf data query --target-org "$ALIAS" \
  --query "SELECT MasterLabel,TotalLicenses,UsedLicenses FROM PermissionSetLicense" --json 2>/dev/null \
  | jq -c '.result.records // []')
LIC_LABELS=$(echo "$LICENSES" | jq -r '.[]?.MasterLabel // empty' | tr '[:upper:]' '[:lower:]')

has_lic() { echo "$LIC_LABELS" | grep -Eqi "$1" && echo true || echo false; }
SHIELD=$(has_lic 'shield|platformencryption')
DATA_CLOUD=$(has_lic 'cdp|customerdataplatform|data cloud')
AGENTFORCE=$(has_lic 'agentforce|einsteingpt|einstein.*copilot')
EVENT_MON=$(has_lic 'eventlog|event monitoring')
FAT=$(has_lic 'fieldaudit|field audit')

step "user licenses (Salesforce, Platform, Experience Cloud)"
USER_LIC=$(sf data query --target-org "$ALIAS" \
  --query "SELECT Name,TotalLicenses,UsedLicenses FROM UserLicense" --json 2>/dev/null \
  | jq '.result.records // []')
AVAIL_LIC_JSON=$(echo "$USER_LIC" | jq 'map({(.Name): (.TotalLicenses - .UsedLicenses)}) | add // {}')

step "Experience Cloud sites"
EXP_SITES=$(qcount "SELECT Id FROM Network")
if [[ "$EXP_SITES" -gt 0 ]]; then EXP_CLOUD=true; else EXP_CLOUD=false; fi

step "Unlocked Packages / 2GP"
PKG2=$(qcount_tooling "SELECT Id FROM Package2 WHERE IsDeprecated=false")

step "installed packages (namespace + version)"
INSTALLED_PKG_JSON=$(sf data query --target-org "$ALIAS" --use-tooling-api \
  --query "SELECT SubscriberPackage.NamespacePrefix,SubscriberPackage.Name,SubscriberPackageVersion.MajorVersion,SubscriberPackageVersion.MinorVersion,SubscriberPackageVersion.PatchVersion FROM InstalledSubscriberPackage" \
  --json 2>/dev/null \
  | jq '[.result.records[]? | {namespace: (.SubscriberPackage.NamespacePrefix // ""), name: (.SubscriberPackage.Name // ""), version: ((.SubscriberPackageVersion.MajorVersion|tostring)+"."+(.SubscriberPackageVersion.MinorVersion|tostring)+"."+(.SubscriberPackageVersion.PatchVersion|tostring))}]' 2>/dev/null)
[[ -z "$INSTALLED_PKG_JSON" || "$INSTALLED_PKG_JSON" == "null" ]] && INSTALLED_PKG_JSON="[]"
INSTALLED_PKG_COUNT=$(echo "$INSTALLED_PKG_JSON" | jq 'length' 2>/dev/null || echo 0)

step "admin segregation (Modify All Data)"
MAD_PS=$(qcount "SELECT Id FROM PermissionSet WHERE PermissionsModifyAllData=true")
MAD_USERS=$(qcount "SELECT Id FROM PermissionSetAssignment WHERE PermissionSet.PermissionsModifyAllData=true AND Assignee.IsActive=true")

step "tenants externos via NamedCredential (endpoints outbound)"
# ConnectedApplication = quem consome esta org (Chatter Desktop, Salesforce for iOS, etc), o inverso do que 'connectedTenants' significa no motor.
# NamedCredential = quem esta org consome outbound (MC/DC/Auth0/SAP/etc).
NAMED_CREDS=$(sf data query --target-org "$ALIAS" \
  --query "SELECT DeveloperName, Endpoint FROM NamedCredential" --json 2>/dev/null \
  | jq -c '[.result.records[]?.DeveloperName // empty]' 2>/dev/null)
[[ -z "$NAMED_CREDS" || "$NAMED_CREDS" == "null" ]] && NAMED_CREDS="[]"
CONNECTED_TENANTS="$NAMED_CREDS"

step "limits (storage, API, concurrent)"
LIMITS_JSON=$(sf limits api display --target-org "$ALIAS" --json 2>/dev/null || echo '{}')
extract_pct() {
  local name="$1"
  echo "$LIMITS_JSON" | jq -r --arg n "$name" '(.result[]? | select(.name==$n)) | if (.max // 0) > 0 then ((.max - (.remaining // .max)) * 100 / .max | floor) else 0 end' 2>/dev/null | head -1
}
extract_max() {
  local name="$1"
  echo "$LIMITS_JSON" | jq -r --arg n "$name" '(.result[]? | select(.name==$n)) | .max // 0' 2>/dev/null | head -1
}
STORAGE_PCT=$(extract_pct "DataStorageMB"); [[ "$STORAGE_PCT" =~ ^[0-9]+$ ]] || STORAGE_PCT=0
API_PCT=$(extract_pct "DailyApiRequests"); [[ "$API_PCT" =~ ^[0-9]+$ ]] || API_PCT=0
CONC_API_PCT=$(extract_pct "ConcurrentAsyncGetReportInstances"); [[ "$CONC_API_PCT" =~ ^[0-9]+$ ]] || CONC_API_PCT=0
CONC_LR_PCT=$(extract_pct "ConcurrentSyncLongRunningTest"); [[ "$CONC_LR_PCT" =~ ^[0-9]+$ ]] || CONC_LR_PCT=0
CONC_API_MAX=$(extract_max "DailyApiRequests"); [[ "$CONC_API_MAX" =~ ^[0-9]+$ ]] || CONC_API_MAX=0
STREAM_PCT=$(extract_pct "StreamingApiConcurrentClients"); [[ "$STREAM_PCT" =~ ^[0-9]+$ ]] || STREAM_PCT=0
BULK_PCT=$(extract_pct "DailyBulkApiBatches"); [[ "$BULK_PCT" =~ ^[0-9]+$ ]] || BULK_PCT=0
FUTURE_PCT=$(extract_pct "HourlyAsyncApexExecutions"); [[ "$FUTURE_PCT" =~ ^[0-9]+$ ]] || FUTURE_PCT=0
OBJ_LIMIT_PCT=$(( CUSTOM_OBJ * 100 / 3000 ))

step "platform events (uso / daily limit / HVPE / Pub-Sub)"
PE_PCT=$(extract_pct "DailyDeliveredPlatformEvents"); [[ "$PE_PCT" =~ ^[0-9]+$ ]] || PE_PCT=0
PE_DAILY_LIMIT=$(extract_max "DailyDeliveredPlatformEvents"); [[ "$PE_DAILY_LIMIT" =~ ^[0-9]+$ ]] || PE_DAILY_LIMIT=0
HVPE_COUNT=$(qcount_tooling "SELECT Id FROM PlatformEventChannel WHERE ChannelType='data'")
if [[ "$HVPE_COUNT" -gt 0 ]]; then HVPE=true; else HVPE=false; fi
PE_PUBLISHED=$(sf data query --target-org "$ALIAS" --use-tooling-api \
  --query "SELECT DeveloperName, NamespacePrefix FROM CustomObject WHERE DeveloperName LIKE '%__e' OR DeveloperName LIKE '%ChangeEvent'" \
  --json 2>/dev/null | jq -c '[
      .result.records[]?
      | select(.NamespacePrefix == null or .NamespacePrefix == "")
      | {name: .DeveloperName, type: (if (.DeveloperName | endswith("ChangeEvent")) then "cdc" else "standard" end)}
    ]' 2>/dev/null)
[[ -z "$PE_PUBLISHED" || "$PE_PUBLISHED" == "null" ]] && PE_PUBLISHED="[]"
# CDC entities habilitadas
CDC_ENTITIES=$(sf data query --target-org "$ALIAS" --use-tooling-api \
  --query "SELECT EntityName FROM ChangeEventSubscriber" --json 2>/dev/null \
  | jq -c '[.result.records[]?.EntityName // empty]' 2>/dev/null)
[[ -z "$CDC_ENTITIES" || "$CDC_ENTITIES" == "null" ]] && CDC_ENTITIES="[]"

step "sandboxes (Full/Partial/Developer + último refresh)"
# Só disponível se estivermos em prod (SandboxInfo query em Tooling API da prod)
SANDBOXES_JSON=$(sf data query --target-org "$ALIAS" --use-tooling-api \
  --query "SELECT LicenseType,SandboxName,ActivatedOn FROM SandboxInfo ORDER BY ActivatedOn DESC" \
  --json 2>/dev/null | jq -c '.result.records // []')
FULL_SBX=$(echo "$SANDBOXES_JSON" | jq '[.[] | select(.LicenseType=="Full")] | length')
PARTIAL_SBX=$(echo "$SANDBOXES_JSON" | jq '[.[] | select(.LicenseType=="Partial Copy" or .LicenseType=="Partial")] | length')
DEV_SBX=$(echo "$SANDBOXES_JSON" | jq '[.[] | select(.LicenseType=="Developer" or .LicenseType=="Developer Pro")] | length')
LAST_REFRESH=$(echo "$SANDBOXES_JSON" | jq -r '.[0].ActivatedOn // empty' | cut -d'T' -f1)
[[ -z "$LAST_REFRESH" ]] && LAST_REFRESH=null || LAST_REFRESH="\"$LAST_REFRESH\""

# --- overlay manual (opcional) ---
OVERLAY_FILE="${ALIAS}.manual.json"
if [[ -f "$OVERLAY_FILE" ]]; then
  step "overlay manual ($OVERLAY_FILE)"
  if ! OVERLAY=$(jq . "$OVERLAY_FILE" 2>/dev/null); then
    echo "erro: $OVERLAY_FILE não é JSON válido — corrija ou remova" >&2
    exit 1
  fi
else
  echo "  · (nenhum $OVERLAY_FILE encontrado — campos manuais como regulator/dataControllerLGPD/lobOwner/ApexGuru/MDM/backup/team/finops ficarão null; monte esse arquivo para o modo Alocação a partir do template)" >&2
  OVERLAY='{}'
fi

# --- monta JSON ---
step "gravando $OUT"
BASE=$(jq -n \
  --arg orgName "$ORG_NAME" \
  --arg edition "$EDITION" \
  --arg timezone "$TIMEZONE" \
  --arg locale "$LOCALE" \
  --arg podRegion "$POD_REGION" \
  --arg sharingModel "$ACC_SHARING" \
  --argjson isMultiCurrency "$IS_MC" \
  --argjson hasPersonAccount "$HAS_PA" \
  --argjson activeLanguages "$ACTIVE_LANGS" \
  --argjson customObjectCount "$CUSTOM_OBJ" \
  --argjson customFieldCount "$CUSTOM_FIELD" \
  --argjson apexClassCount "$APEX_CLASS" \
  --argjson userRoleCount "$ROLES" \
  --argjson territoryModelCount "$TERR" \
  --argjson sharingRuleCount "$SHARING_RULE" \
  --argjson triggerCount "$TRIGGERS" \
  --argjson flowCount "$FLOWS" \
  --argjson permSetCount "$PERMSETS" \
  --argjson roleHierarchyDepth "$ROLE_DEPTH" \
  --argjson shieldEnabled "$SHIELD" \
  --argjson dataCloudEnabled "$DATA_CLOUD" \
  --argjson agentforceEnabled "$AGENTFORCE" \
  --argjson eventMonitoringEnabled "$EVENT_MON" \
  --argjson fatEnabled "$FAT" \
  --argjson experienceCloudEnabled "$EXP_CLOUD" \
  --argjson package2Count "$PKG2" \
  --argjson installedPackages "$INSTALLED_PKG_JSON" \
  --argjson installedPackageCount "$INSTALLED_PKG_COUNT" \
  --argjson modifyAllPermSets "$MAD_PS" \
  --argjson modifyAllUserCount "$MAD_USERS" \
  --argjson availableLicenses "$AVAIL_LIC_JSON" \
  --argjson connectedTenants "$CONNECTED_TENANTS" \
  --argjson storagePct "$STORAGE_PCT" \
  --argjson apiUsagePct "$API_PCT" \
  --argjson customObjectLimitPct "$OBJ_LIMIT_PCT" \
  --argjson concurrentApiUsagePct "$CONC_API_PCT" \
  --argjson concurrentApiLimit "$CONC_API_MAX" \
  --argjson streamingClientsPct "$STREAM_PCT" \
  --argjson bulkJobsDailyPct "$BULK_PCT" \
  --argjson concurrentLongRunningPct "$CONC_LR_PCT" \
  --argjson futureQueuePendingPct "$FUTURE_PCT" \
  --argjson platformEventUsagePct "$PE_PCT" \
  --argjson platformEventDailyLimit "$PE_DAILY_LIMIT" \
  --argjson hvpeEnabled "$HVPE" \
  --argjson platformEventPublishedTypes "$PE_PUBLISHED" \
  --argjson cdcEnabledEntities "$CDC_ENTITIES" \
  --argjson fullCopySandboxes "$FULL_SBX" \
  --argjson partialCopySandboxes "$PARTIAL_SBX" \
  --argjson developerSandboxes "$DEV_SBX" \
  --argjson lastSandboxRefresh "$LAST_REFRESH" \
  '{orgName:$orgName, edition:$edition, timezone:$timezone, locale:$locale, podRegion:$podRegion,
    sharingModel:$sharingModel, isMultiCurrency:$isMultiCurrency, hasPersonAccount:$hasPersonAccount,
    activeLanguages:$activeLanguages,
    customObjectCount:$customObjectCount, customFieldCount:$customFieldCount, apexClassCount:$apexClassCount,
    userRoleCount:$userRoleCount, territoryModelCount:$territoryModelCount, sharingRuleCount:$sharingRuleCount,
    triggerCount:$triggerCount, flowCount:$flowCount, permSetCount:$permSetCount,
    roleHierarchyDepth:$roleHierarchyDepth,
    shieldEnabled:$shieldEnabled, dataCloudEnabled:$dataCloudEnabled, agentforceEnabled:$agentforceEnabled,
    eventMonitoringEnabled:$eventMonitoringEnabled, fatEnabled:$fatEnabled, experienceCloudEnabled:$experienceCloudEnabled,
    package2Count:$package2Count, installedPackages:$installedPackages, installedPackageCount:$installedPackageCount,
    modifyAllPermSets:$modifyAllPermSets, modifyAllUserCount:$modifyAllUserCount,
    availableLicenses:$availableLicenses, connectedTenants:$connectedTenants,
    storagePct:$storagePct, apiUsagePct:$apiUsagePct, customObjectLimitPct:$customObjectLimitPct,
    concurrentApiUsagePct:$concurrentApiUsagePct, concurrentApiLimit:$concurrentApiLimit,
    streamingClientsPct:$streamingClientsPct, bulkJobsDailyPct:$bulkJobsDailyPct,
    concurrentLongRunningPct:$concurrentLongRunningPct, futureQueuePendingPct:$futureQueuePendingPct,
    platformEventUsagePct:$platformEventUsagePct, platformEventDailyLimit:$platformEventDailyLimit,
    hvpeEnabled:$hvpeEnabled, platformEventPublishedTypes:$platformEventPublishedTypes,
    cdcEnabledEntities:$cdcEnabledEntities,
    fullCopySandboxes:$fullCopySandboxes, partialCopySandboxes:$partialCopySandboxes,
    developerSandboxes:$developerSandboxes, lastSandboxRefresh:$lastSandboxRefresh}')

# Merge overlay → base:
#  · descarta chaves começadas com "__" (comentários do template)
#  · escalares e a maioria dos arrays: overlay sobrescreve base
#  · installedPackages: casa por namespace, enriquecendo o pacote extraído com
#    licenseType/allowsExtension do overlay em vez de apagar os outros pacotes
echo "$BASE" | jq --argjson overlay "$OVERLAY" '
  ($overlay | with_entries(select(.key | startswith("__") | not))) as $ov
  | ($ov | del(.installedPackages)) as $ovScalars
  | (if ($ov | has("installedPackages"))
       then ($ov.installedPackages // []) | map({(.namespace): .}) | add // {}
       else null
     end) as $ovPkgIdx
  | . + $ovScalars
  | if $ovPkgIdx == null then .
    else
      .installedPackages = (
        (.installedPackages // []) as $auto
        | ($ovPkgIdx | keys) as $ovNs
        | ($auto | map(.namespace)) as $autoNs
        | ($auto | map(. + ($ovPkgIdx[.namespace] // {})))
          + ($ovNs - $autoNs | map($ovPkgIdx[.]))
      )
    end
' > "$OUT"

if [[ -s "$OUT" ]]; then
  echo "" >&2
  echo "✓ $OUT gerado" >&2
  if [[ ! -f "$OVERLAY_FILE" ]]; then
    echo "" >&2
    echo "ATENÇÃO: sem $OVERLAY_FILE, o modo Alocação vai reportar warn em vários filtros (regulator, dataController, backup, team, MDM, incidents, ApexGuru, contratos, envStrategy, retenção, growth). Monte esse arquivo copiando org-metadata.manual.template.json e ajustando." >&2
  fi
else
  echo "erro: $OUT ficou vazio. Rode com bash -x $0 $ALIAS para debug" >&2
  exit 1
fi
