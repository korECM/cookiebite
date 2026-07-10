# Freeform-First Report Architecture

**Status:** Approved in design discussion; implementation pending

**Date:** 2026-07-10

## 1. Context

cookiebite currently contains strong editorial guidance, a large helper runtime, type-specific scaffolds, a theme system, and a comprehensive verifier. In practice, the default path starts from components: KPI cards, icon-led section headings, filters, gauges, a sticky table of contents, elevated chart cards, and multiple third-party libraries.

A user-supplied, hand-authored incident-analysis report produced a clearer result with a much smaller system. It kept cookiebite's best ideas—an answer-first standfirst, one memorable hero number, restrained color, claim-specific charts, and setup → visual → takeaway sections—while omitting most framework chrome. The missing runtime acted as a useful constraint: the report was composed around its argument instead of around available helpers.

The installed skill also currently demonstrates a packaging gap: only `SKILL.md` is present, while the documented `assets/`, `scripts/`, and `references/` directories are absent. Repository-local evals do not exercise the installed layout, so they cannot catch this failure.

This design changes the default from **component-first dashboard assembly** to **freeform reading material backed by a small design contract**.

## 2. Decision Summary

cookiebite will use this default flow:

```text
claims and evidence
  → minimal theme seed
  → free semantic HTML/CSS composition
  → optional behavior primitives
  → selective inline assembly
  → real-browser verification
  → delivered single-file report
```

The key decisions are:

1. Composition stays free. No closed page, section, card, or chart vocabulary owns the document.
2. A small theme seed owns repeated visual decisions, not layout.
3. Derived tokens are generated and contrast-checked rather than manually duplicated.
4. Primitives enhance authored DOM; they do not create cards, headings, spacing, icons, or page structure.
5. Optional capabilities and third-party dependencies are included only when used.
6. The verifier blocks broken, inaccessible, or misleading output, but only advises on aesthetic choices and token promotion.
7. Skill changes are evaluated against the current version with blind human comparison, not only structural assertions.
8. Release verification runs from an installed/copied skill layout, not only the repository root.

## 3. Goals

- Make a quiet, readable, single-column report the default starting point.
- Preserve full freedom to author semantic HTML, CSS, SVG, and ECharts options.
- Keep repeated visual decisions consistent and safely themeable.
- Minimize the number of values an author must choose.
- Retain accessibility, data-honesty, responsive, and runtime safety checks.
- Avoid loading libraries or emitting UI controls that the report does not need.
- Make packaging failures release-blocking.
- Measure whether the new skill improves comprehension and preference across different report types.

## 4. Non-Goals

- Pixel-copying the user-supplied reference report.
- Removing advanced dashboard, explainer, comparison, or postmortem capabilities.
- Forcing every report to use the same layout or visual density.
- Turning every one-off CSS value into a global token.
- Automatically rewriting a report based on verifier suggestions.
- Making every report fully offline. Third-party libraries may remain CDN-hosted when selected.
- Requiring dark mode. Dark output is opt-in and is verified only when present.

## 5. Design Principles

### 5.1 Story before structure

Before HTML is authored, identify one to three claims and order their evidence. This is a reasoning step, not a rigid serialized schema. The resulting section count and order come from the material.

### 5.2 Tokens are a safety rail, not a component menu

Tokens describe reusable visual roles such as background, text, accent, measure, and surface strategy. They never prescribe that a report needs a hero card, KPI grid, right rail, or bento layout.

### 5.3 Promote repetition, permit one-offs

- Used once: a direct value is allowed.
- Repeated within one report: promote it to a report-local custom property.
- Repeated with the same meaning across reports: promote it to the shared token contract.

The system warns about promotion candidates. It does not reject legitimate one-off composition.

### 5.4 Primitives enhance; authors compose

Behavior primitives operate on existing hosts or semantic markup. They do not introduce visual wrappers or layout decisions.

### 5.5 Safety is strict where correctness is objective

Broken layout, inaccessible interaction, unsafe contrast, missing data alternatives, runtime errors, and misleading charts are failures. Card density or whether a long report deserves a table of contents remains an evidence-backed suggestion.

## 6. Architecture

### 6.1 Layer 1: Narrative planning

Inputs are the user's data, notes, findings, or analysis. The author determines:

- the one to three claims the reader should retain;
- the evidence order supporting those claims;
- which claims need a figure, chart, table, diagram, or prose;
- which interactions answer a real secondary question.

No report-type scaffold is selected until this reasoning is complete. A dashboard is chosen only when the material is genuinely scanned and sliced rather than read in sequence.

### 6.2 Layer 2: Minimal design core

The design core consists of:

- a compact theme seed;
- a deterministic token compiler;
- minimal reset, typography, responsive, and print styles;
- locale-aware number and date formatting;
- verifier instrumentation hooks.

It contains no section, page, card, header, navigation, or chart layout helper.

### 6.3 Layer 3: Optional capability primitives

Capabilities are independent modules. The initial set is:

| Capability | Responsibility | Explicitly does not do |
|---|---|---|
| `chart` | Theme an authored ECharts option; resize; expose ARIA and a data alternative | Create a card, caption, section, or title |
| `table` | Add keyboard-safe sorting and numeric comparison to an authored semantic table | Replace it with a third-party grid by default |
| `glossary` | Attach accessible definitions to authored terms | Decide which terms are jargon |
| `motion` | Provide reduced-motion-safe lifecycle helpers | Add decorative animation |
| `export` | Export an explicitly selected report region or chart | Add toolbar chrome automatically |

### 6.4 Layer 4: Rendered-output verifier

The verifier opens the final artifact at real viewport widths, drives declared interactions, captures evidence, and classifies findings as failures, warnings, or information. It never edits the artifact.

### 6.5 Skill instruction layer

`SKILL.md` remains a router and workflow contract rather than a complete component manual. It targets fewer than 500 lines and contains only:

- triggering and scope;
- narrative-first decision flow;
- the seed and promotion rules;
- capability selection;
- required inline and verification gates;
- precise pointers to optional references.

Capability signatures, chart-form guidance, recipes, and advanced interactions live in references loaded only when selected. A normative rule or scaffold recipe has one source of truth; generated examples may copy it, but separately maintained duplicates are not allowed to drift.

## 7. Theme Seed and Token Contract

### 7.1 Author-owned seed

An author normally chooses eight values:

```json
{
  "font": "Pretendard Variable, Pretendard, sans-serif",
  "background": "#FAFAF9",
  "text": "#1A1A1A",
  "accent": "#E8503A",
  "spaceUnit": 4,
  "measure": "68ch",
  "radius": 12,
  "surface": "border"
}
```

`surface` is one of:

- `border`: surfaces separate with hairlines; shadows are absent by default;
- `tonal`: surfaces separate through background tone;
- `shadow`: elevation is available where hierarchy requires it.

The default Persimmon reading theme uses `border`.

### 7.2 Compiler-derived tokens

The token compiler derives and emits resolved CSS custom properties for:

- base and elevated surfaces;
- primary, secondary, and disabled text;
- default and subtle dividers;
- accent strong, soft, on-accent, and focus colors;
- the spacing scale from `spaceUnit`;
- the responsive type scale;
- default section rhythm and prose measure;
- surface border or elevation values;
- emphasis chart colors derived from accent plus neutrals.

Color derivation uses a perceptual color space and validates the resulting foreground/background pairs. The final HTML receives resolved values so chart libraries and older browser paths do not depend on understanding CSS color expressions.

### 7.3 Optional seeds

These are emitted only when the report uses them:

- heading or mono font;
- positive, warning, critical, and informational status colors;
- a peer-series identity palette;
- an explicit dark theme seed;
- report-specific data-visualization roles.

Every optional value has a safe library default. Authors override it only to express a real design or domain requirement.

### 7.4 Override and scope rules

- Seed keys may be explicitly overridden before compilation.
- Derived tokens may be overridden only by semantic role, never by component name.
- Component-specific names such as `--kpi-card-shadow` are forbidden.
- Report-local custom properties live beside the report content and are not promoted to global presets automatically.
- A repeated raw value is a warning with source locations, not a build failure.

## 8. Default Scaffold

The default scaffold is a reading document, not a demo dashboard. It provides only:

- a page title;
- a one-sentence standfirst;
- an optional hero claim or figure;
- zero or more semantic sections;
- a source/method footer;
- editable slots and the minimal theme seed.

A typical section shape is:

```html
<section id="evidence-name">
  <h2>Claim-oriented heading</h2>
  <p class="setup">One sentence explaining what the reader is about to see.</p>
  <figure>
    <div id="authored-visual"></div>
    <figcaption>One sentence explaining what to notice.</figcaption>
  </figure>
</section>
```

The scaffold does not add:

- section icons;
- a table of contents;
- KPI cards;
- dark or print controls;
- filters, toggles, gauges, or tables;
- shadows or elevated wrappers;
- optional libraries.

Those are authored only after the narrative and data justify them. An explicit dashboard scaffold remains available, but it is no longer the mental or structural default.

## 9. Primitive API Contract

New-report APIs enhance existing markup:

```js
CB.chart('#traffic-chart', {
  option: ({ theme }) => buildTrafficOption(theme),
  data,
  ariaLabel: 'Hourly allowed traffic by classification'
});

CB.sortable('#fingerprint-table', {
  numericColumns: [2, 3, 4]
});
```

Required behavior:

- A missing host or invalid configuration fails with a specific error.
- `chart` requires enough structured data to produce its accessible alternative.
- Theme changes re-evaluate authored chart options through a callback rather than mutating baked colors.
- Primitives return handles for update, resize, and disposal.
- No primitive inserts a parent surface or sibling heading.

KPI, findings, timeline, comparison, and similar visual patterns move to copyable recipes. The existing full helper runtime remains an explicit compatibility bundle for existing reports and advanced users; new default scaffolds do not load it.

## 10. Capability and Dependency Assembly

Each report declares capabilities explicitly in an editable manifest marker:

```html
<!-- COOKIEBITE:USE chart table -->
```

The inliner:

1. validates that each declared capability exists;
2. compiles the theme seed to resolved CSS variables;
3. inlines core CSS and JavaScript;
4. inlines only selected cookiebite modules;
5. emits only the third-party CDN tags required by those modules;
6. fails when authored code calls a cookiebite capability absent from the manifest;
7. writes a dependency summary into verification output.

The manifest describes behavior, never layout. Static auto-detection is not the source of truth because minified, indirect, or dynamically composed calls are too easy to miss.

## 11. Verification Policy

### 11.1 Viewports

Every final artifact is rendered at:

- 390px narrow;
- 768px medium;
- 1280px desktop.

Dark passes run only when the theme seed declares dark values. Interaction checks run only for declared capabilities, but every declared interaction must be driven.

### 11.2 Failures

The following block delivery:

- page-level horizontal overflow;
- clipped or overlapping text and chart labels;
- empty, collapsed, or degenerate charts;
- uncaught exceptions, `console.error`, and required resource failures;
- body-text contrast below WCAG AA;
- interactive elements unreachable by keyboard;
- status conveyed by color alone;
- missing chart ARIA or data alternative;
- misleading visual encodings, including truncated bar baselines;
- caption or label claims contradicted by rendered data;
- undeclared capability use;
- missing installed assets or scripts.

### 11.3 Warnings

Warnings carry evidence but do not block delivery:

- repeated raw colors, spacing, radii, or elevation values;
- excessive cards, shadows, icons, or visible controls;
- unused capabilities or libraries;
- a long document with no navigation aid;
- content that may be clearer as prose than as a visual;
- duplicated charts or sections making the same claim;
- an optional token that may deserve promotion.

### 11.4 Information

Informational findings include:

- dependency and bundle-size breakdown;
- removable derived tokens;
- cross-report token-promotion candidates;
- DOM, surface, control, and external-resource counts for evaluation.

### 11.5 Evidence format

Every recorded finding, whether produced automatically or confirmed during visual review, records:

- severity and rule identifier;
- viewport and theme;
- selector or chart identifier;
- concise reason;
- measured values where applicable;
- screenshot tile or bounding rectangle.

The verifier does not auto-fix any visual decision.

## 12. Error Handling

- **Invalid seed:** fail before rendering and name the invalid key/value.
- **Unsafe derived contrast:** adjust within the derivation contract; fail if no valid result exists.
- **Missing capability:** fail during inline with the required manifest addition.
- **Missing optional library:** fail the related capability, not unrelated report content.
- **Missing host:** fail at the exact primitive call instead of silently returning.
- **Unavailable browser verifier:** static checks may run, but release verification remains incomplete and cannot pass.
- **Installed-layout mismatch:** report which required path is absent and fail the packaging gate.

Errors must explain the smallest corrective action. No fallback may silently remove content, accessibility, or interaction.

## 13. Packaging and Release Gate

The release gate creates a clean temporary installation matching the published directory shape. It then verifies:

1. `SKILL.md`, required references, assets, scripts, and selected nested skills are present;
2. the default reading scaffold builds from the installed path;
3. a chart-only report and a chart-plus-table report inline successfully;
4. the inlined files open directly;
5. `verify-report.sh` passes from the installed path;
6. dependency selection includes no unused cookiebite module or third-party tag.

Repository-root success is insufficient. Failure of the installed-layout smoke test blocks release.

## 14. Evaluation Design

### 14.1 Cases

Run the old and new skill on the same three realistic prompts:

1. an evidence-heavy incident or abuse investigation that should read as an argument;
2. an operational dashboard where filters, sorting, and zoom answer real questions;
3. a technical explainer where a diagram and controlled progressive disclosure are useful.

The user-supplied hand-authored report is a qualitative reference for clarity and restraint, not a pixel fixture and not committed as test data.

### 14.2 Blind human review

Reviewers see old and new outputs without version labels and judge:

- whether the main conclusion is visible within five seconds;
- whether sections form an argument rather than a component inventory;
- whether decoration or controls compete with content;
- whether interactions earn their place;
- whether the artifact is worth reading and sharing.

### 14.3 Quantitative evidence

Record, without treating lower as automatically better:

- all hard verification results;
- whether the first claim is visible in the initial viewport;
- used and unused dependencies;
- raw-value and token counts;
- surface, shadow, icon, control, and external-resource counts;
- final file size, generation time, and token usage.

### 14.4 Acceptance

The new version must:

- pass every hard verifier rule;
- pass the installed-layout release gate;
- avoid losing any of the three blind comparisons;
- be preferred for clarity in at least two of the three cases;
- demonstrate that the true dashboard case still receives useful interactions;
- demonstrate that the narrative cases do not manufacture them.

## 15. Compatibility and Migration

- Existing inlined reports remain immutable and require no migration.
- The current full helper runtime remains available as an explicit compatibility bundle.
- New scaffolds and documentation lead with the freeform core.
- Existing presets are migrated to eight-value seeds plus explicit overrides; visual differences require screenshot review.
- Complete pattern helpers become recipes before they are deprecated from the default path.
- No report is silently rewritten from full runtime to core runtime.

## 16. Implementation Boundaries

Implementation should proceed in independently verifiable slices:

1. codify this approved direction in a root `DESIGN.md` and a responsive primitive showcase;
2. theme seed schema, compiler, and minimal core;
3. freeform reading scaffold and selective inliner;
4. chart and semantic-table primitives;
5. verifier severity/evidence changes;
6. installed-layout packaging gate;
7. old/new eval workspace and blind review.

The detailed implementation plan is written only after this design is reviewed and approved.
