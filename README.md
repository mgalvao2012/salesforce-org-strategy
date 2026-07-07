# Salesforce Multi-Org Strategy

Interactive tool to support architectural decisions in Salesforce ecosystems:

1. **Topology Mode** — greenfield: decide between **Single Org**, **Multi-Org Hub-and-Spoke**, or **Multi-Org Federated** based on a weighted questionnaire.
2. **Allocation Mode** — existing landscape: given a new process/initiative and the metadata of N production orgs, decide **which org to allocate it to** or **justify the creation of a new org**.

**100% client-side** application (HTML + ES Modules, no build, no backend). Just serve the files via a local HTTP server and open in the browser.

Interface available in **Portuguese (pt-BR, default)**, **English (en-US)**, and **Spanish (es-ES)**.

**_Disclaimer:_**
_This framework is based on Salesforce Well-Architected + Six-Factor (T. Leddy) + CTA practices. Decision-support tool — does not replace a formal architecture review._

---

## Table of Contents

- [When to use](#when-to-use)
- [Prerequisites](#prerequisites)
- [Setup and run](#setup-and-run)
- [How to use](#how-to-use)
  - [Topology Mode](#topology-mode)
  - [Allocation Mode](#allocation-mode)
- [Collecting metadata from a real org](#collecting-metadata-from-a-real-org)
- [Tests](#tests)
- [Internationalization (i18n)](#internationalization-i18n)
- [Project structure](#project-structure)
- [How the engine decides](#how-the-engine-decides)
- [Contributing](#contributing)

---

## When to use

| Scenario | Mode |
|---|---|
| Client without Salesforce yet; greenfield discussion about topology | Topology |
| Client with N orgs; a new process (LGPD, wallet, portal, etc.) arrived and you need to decide *where to place it* | Allocation |
| Merger/acquisition, spin-off, new regulatory obligation (BACEN, CVM, SUSEP) | Both — Topology for the target model, Allocation for the transitional state |
| Discussion about creating one more org (technical justification vs. political) | Allocation — the engine generates the per-filter rationale |

---

## Prerequisites

**Runtime**
- Node.js 18+ (only to run the tests; the UI is plain HTML)
- Any local HTTP server:
  - `python3 -m http.server` (built-in)
  - `npx serve` / `npx http-server`
  - VS Code Live Server extension
  - Any other that serves `.html` + `.mjs` with the correct MIME type (`text/javascript`)

Opening the HTML directly from the filesystem (`file://`) **does not work** — the browser blocks cross-origin ES Modules.

**Metadata collection (optional, only if you plan to use Allocation Mode with real orgs)**
- Salesforce CLI (`sf`) authenticated to the target orgs — `sf org login web -a <alias>`
- `jq` (the `extract-org-metadata.sh` script uses it to parse JSON)

---

## Setup and run

Clone and serve locally:

```bash
git clone <repo-url> salesforce-org-strategy
cd salesforce-org-strategy

# option 1: python (nothing to install)
python3 -m http.server 8080

# option 2: npx (Node required)
npx serve -p 8080
```

Open [http://localhost:8080/salesforce-org-strategy-questionnaire.html](http://localhost:8080/salesforce-org-strategy-questionnaire.html) in the browser.

The language is auto-detected from `navigator.language` (falls back to pt-BR) and persisted in `localStorage`. Use the PT / EN / ES switcher in the header to change at runtime.

---

## How to use

### Topology Mode

1. Select **Topology Mode** on the initial screen.
2. Answer the questionnaire (13 base questions + up to 4 complementary Hub-vs-Federated questions when the score points to Multi).
3. Each question has options with weights that add up on two sides: **Single** vs **Multi**.
4. At the end, the page shows:
   - Recommendation (Single / Multi Hub-and-Spoke / Multi Federated / Borderline)
   - Numeric score and proportion bar
   - **Criteria supporting the recommendation** — each answer that influenced the outcome, with textual rationale
   - **Overrides** — critical flags (regulator, LGPD, active M&A) that force Multi even when the numeric score would say Single
   - Algorithm explainer (collapsible "How this score was calculated")

### Allocation Mode

1. Select **Allocation Mode** on the initial screen.
2. **Load the metadata of existing orgs** — drag one or more `.json` files (format described below) to the upload area. Each file = one org.
3. **Describe the new process** — fill in the form (applicable regulator, LGPD controller, LOB, desired release cadence, use of Person Account/Multi-Currency, required Salesforce features, storage/API/object/field/class projections, ApexGuru capacity headroom, CDC/PE contracts, external feeds, vendors, required backup, etc.).
4. Click **Run allocation**.
5. For each loaded org, the engine generates:
   - Final score (0-100)
   - Filter chain (~45) with **PASS** / **WARN** / **FAIL** verdicts and textual justification per filter
   - Recommendation: **Allocate here**, **Allocate with caveats**, **Do not allocate**
   - If no org passes: **New org justified** with rationale (which filters failed on which orgs).
6. Alternatives (side cards) show trade-offs among the top-3 orgs by score.

Ready-made examples to test: [samples/OrgAsset.json](samples/OrgAsset.json), [samples/OrgCorporativa.json](samples/OrgCorporativa.json), [samples/OrgVarejoPF.json](samples/OrgVarejoPF.json).

---

## Collecting metadata from a real org

The metadata Allocation Mode consumes is a JSON in the format described in [sample-org-metadata.json](sample-org-metadata.json) (minimum) and [org-metadata.manual.template.json](org-metadata.manual.template.json) (complete, with every human-provided block).

Two routes:

### Route A — automated (`sf` CLI + `jq`)

```bash
chmod +x extract-org-metadata.sh
./extract-org-metadata.sh <org-alias> output.json
```

The script collects via `sf` everything extractable by API (counters of objects, fields, apex, roles, sharing rules, enabled features, installed packages, etc.) and produces the JSON.

**Human-provided fields** (regulator, LGPD controller, LOB, CDC/PE contracts, ApexGuru trend, backup SLA, team headcount, incidents, docScore, cost, retention) **do not come from `sf`** — you need to create `<alias>.manual.json` alongside, and the script merges both into the final output. Use [org-metadata.manual.template.json](org-metadata.manual.template.json) as a starting point.

### Route B — manual

Copy [org-metadata.manual.template.json](org-metadata.manual.template.json), rename it, fill in what you know. Missing fields become `null`/`0`/`false` and fall back to **WARN** in the corresponding filter — they don't break the analysis, they just reduce confidence.

Repeat per org. Upload every JSON in the Allocation screen (multi-select).

---

## Tests

Full unit test suite for the allocation engine (145 cases covering each filter with `pass`/`warn`/`fail` scenarios):

```bash
node tests/allocation-tests.mjs        # 145 asserts on the engine
node tests/advanced-tests.mjs          # 15 combinatorial scenarios (cascade, overrides)
node tests/coverage-check.mjs          # verifies filter coverage
node tests/effectiveness-check.mjs     # sanity check on the 3 samples
node tests/samples-coverage.mjs        # verifies samples exercise every filter
```

There is no test framework — asserts are plain JS with `console.assert` + readable output.

The tests keep working after the i18n migration because `t()` returns the pt-BR string when the default language is active (default in headless test runs).

---

## Internationalization (i18n)

- Flat dictionaries with dot-namespaced keys (`q.residency.text`, `engine.filter.regulator.match`) in [i18n/pt-BR.mjs](i18n/pt-BR.mjs), [i18n/en-US.mjs](i18n/en-US.mjs), [i18n/es-ES.mjs](i18n/es-ES.mjs) — 785 keys each, 100% parity.
- Runtime: [i18n.mjs](i18n.mjs) exposes `t(key, params)`, `tList(prefix, suffix)`, `setLang(lang)`, `getLang()`, `initLang()`.
- Template placeholders: `'Regulator ({reg})'` with `t('key', { reg: 'BACEN' })`.
- Static HTML nodes use `data-i18n="key"` (textContent) and `data-i18n-html="key"` (innerHTML). The `applyStaticI18n()` helper walks the DOM and replaces them.
- Switching language dispatches `CustomEvent('langchange')`; the listener re-renders the form, questions, and any visible result panels.
- Salesforce technical terms (Shield, Data Cloud, Person Account, Multi-Currency, Pub/Sub API, 2GP, MDM, BACEN, CVM, LGPD, etc.) are preserved untranslated across every language.

To add a new language:
1. Copy `i18n/pt-BR.mjs` to `i18n/<lang>.mjs` and translate the values.
2. Add the code to the `SUPPORTED` list in [i18n.mjs:5](i18n.mjs#L5).
3. Import and register in the HTML: `import <lang> from './i18n/<lang>.mjs'; registerTranslations('<lang>', <lang>)`.
4. Add the button to the language switcher in the HTML.

---

## Project structure

```
.
├── salesforce-org-strategy-questionnaire.html   # Single UI — both modes
├── allocation-engine.mjs                        # Engine: ~45 filters, ranking, cascade
├── i18n.mjs                                     # i18n runtime (t, setLang, langchange)
├── i18n/
│   ├── pt-BR.mjs                                # 785 keys — source of truth
│   ├── en-US.mjs                                # 785 keys
│   └── es-ES.mjs                                # 785 keys
├── extract-org-metadata.sh                      # sf CLI + jq → JSON in the expected format
├── org-metadata.manual.template.json            # Template for human-provided fields
├── sample-org-metadata.json                     # Minimal metadata (only sf-extractable)
├── samples/
│   ├── OrgAsset.json                            # Exemplary financial org
│   ├── OrgCorporativa.json                      # Legacy corporate org
│   └── OrgVarejoPF.json                         # Retail Person Account org
└── tests/
    ├── allocation-tests.mjs                     # 145 asserts across filters
    ├── advanced-tests.mjs                       # 15 combinatorial scenarios
    ├── coverage-check.mjs
    ├── effectiveness-check.mjs
    └── samples-coverage.mjs
```

---

## How the engine decides

**Topology** — weighted score. Each answer adds points to `single` or `multi`. Critical overrides (distinct regulator, distinct LGPD controller, active M&A) force Multi. When Multi, a second score inside the Hub-vs-Federated block decides the flavor.

**Allocation** — filter pipeline per org:

1. **HARD FAILS** (incompatible regulator, conflicting LGPD controller, declared incompatible LOB, missing feature with no workaround, incompatible package, sunset)
2. **SOFT FAILS** (projection exceeds limits, incompatible cadence, insufficient capacity headroom, degrading health, saturated ApexGuru)
3. **WARNS** (missing data, LOB divergent with override allowed, feature via workaround, expiring contracts, low docScore, backup below desired)
4. **PASS** with positive metrics

Final score = 100 - Σ(per-filter penalties). Recommendation:
- Score ≥ 80 and 0 fails → **Allocate here**
- 60 ≤ score < 80 or soft fails → **Allocate with caveats**
- Score < 60 or hard fail → **Do not allocate**
- All orgs FAIL → **New org justified** (with aggregated rationale)

Details of each filter live in [allocation-engine.mjs](allocation-engine.mjs) and the strings in [i18n/pt-BR.mjs](i18n/pt-BR.mjs) under the `engine.filter.*` prefix.

---

## Contributing

- New filters: add the function in [allocation-engine.mjs](allocation-engine.mjs), register a `pass`/`warn`/`fail` case in [tests/allocation-tests.mjs](tests/allocation-tests.mjs), add text keys to all 3 languages.
- New topology questions: extend the `questions` array in the HTML (ID + weights + options with ID only); register texts in pt-BR/en/es under the `q.<id>.*` prefix.
- Tests must keep passing (`node tests/allocation-tests.mjs` + `node tests/advanced-tests.mjs`).
- Before large refactors in `allocation-engine.mjs` or the HTML, create a `.bak` copy alongside (already gitignored).
