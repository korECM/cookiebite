# Component cheat-sheet (declarative building blocks)

A small, **named vocabulary** of report components — copy-adapt these. The point is
consistency: every component speaks the same `tone` language and reads from the same
design tokens, so a report assembled from them looks designed, not improvised. (This is
the static-HTML analogue of a canvas component kit — `Stat`, `Callout`, `Pill`, `Table`
— with one unified semantic prop threaded through all of them.)

All snippets use the template's token classes (`bg-surface`, `text-secondary`,
`border-line-weak`, `text-accent`, the semantic `text-critical/cautionary/positive/informative`,
the type scale `text-body-14`/`text-title-20`, `nums`, the radius/shadow scales). They
re-theme automatically — including **dark mode** — because every color is a CSS var.

---

## The `tone` contract (use these five names everywhere)

One semantic scale, threaded through **every** component (callouts, pills, stat deltas,
table rows, findings, diff). Pick the tone by *meaning*, never decorate with it.

| `tone`     | Meaning                       | Token             | Text class          | Tint bg (`/10`–`/15`)   | Icon (Lucide)     |
|------------|-------------------------------|-------------------|---------------------|-------------------------|-------------------|
| `neutral`  | no status / informational     | `--c-secondary`   | `text-secondary`    | `bg-disabled-bg`        | `minus` / none    |
| `info`     | noteworthy, FYI               | `--c-informative` | `text-informative`  | `bg-informative/10`     | `info`            |
| `success`  | good / healthy / done         | `--c-positive`    | `text-positive`     | `bg-positive/10`        | `check`           |
| `warning`  | caution / needs attention     | `--c-cautionary`  | `text-cautionary`   | `bg-cautionary/15`      | `alert-triangle`  |
| `critical` | bad / failing / blocking      | `--c-critical`    | `text-critical`     | `bg-critical/10`        | `octagon-x`       |

Rules: **one accent per report** (accent ≠ a tone — it's brand/emphasis); tones are for
status only. **Never color-alone** — pair every tone with an icon or a text label
(`✓ 정상`, not a bare green dot). `accent-weak`/`bg-cautionary/15` use a slightly higher
opacity for amber so it reads.

> **`findings` remaps `tone` to a severity *label*.** In `COOKIEBITE.findings`, `tone`
> sets the color *and* the chip text: `critical`→"Critical", `warning`→"High",
> `info`→"Medium", `neutral`→"Low". This is the only component where `tone` changes the
> text — elsewhere it sets color alone. `success` has no severity meaning in a findings
> list, so it falls back to "Note". Pass `label` on the item to override the chip text
> (e.g. `{ tone: 'warning', label: '주의', … }`).

---

## Pill / Tag — `tone`

Compact status/metadata label. The most reused primitive.

```html
<!-- tone=success -->
<span class="inline-flex items-center gap-4 px-8 py-2 rounded-xxs bg-positive/10 text-positive text-caption-12 font-medium">
  <i data-lucide="check" class="w-12 h-12"></i>정상
</span>
<!-- tone=warning -->
<span class="inline-flex items-center gap-4 px-8 py-2 rounded-xxs bg-cautionary/15 text-cautionary text-caption-12 font-medium">
  <i data-lucide="alert-triangle" class="w-12 h-12"></i>주의
</span>
<!-- neutral metadata chip (no status) -->
<span class="px-8 py-2 rounded-xxs bg-disabled-bg text-secondary text-caption-12">v2.4.1</span>
```

## Callout — `tone`

A boxed insight/status sentence. Left accent bar in the tone color + icon + one line.

```html
<!-- tone=info -->
<div class="flex gap-12 rounded-medium bg-informative/10 border-l-4 border-informative p-16">
  <i data-lucide="info" class="w-20 h-20 text-informative shrink-0 mt-2"></i>
  <p class="text-body-14"><b>핵심.</b> HTML은 리뷰어가 에이전트 작업에 계속 관여하게 돕습니다.</p>
</div>
```
Swap `informative` → `positive`/`cautionary`/`critical` for the other tones (bg `/10`,
amber `/15`). Keep it to one or two sentences; a callout is a highlight, not a section.

## Stat / KPI card

See the template for the full version (label · big number via CountUp · delta badge ·
sparkline). The delta badge **is** a `tone`: `success` when up-is-good, `critical` when
up-is-bad, `neutral` `—` when there's no baseline (sentinel over a fake zero).

---

## Diff view (added / removed lines)

For change/PR-review reports: show what changed, color-coded, monospace. Tone-mapped:
added = `success`, removed = `critical`, context = `neutral`. Keep it a **unified** diff
(one column) unless the file is wide; left gutter carries `+`/`−` so it survives grayscale.

```html
<div class="rounded-medium border border-line-weak overflow-hidden font-mono text-caption-12 leading-relaxed">
  <div class="flex items-center justify-between px-12 py-8 bg-disabled-bg text-secondary">
    <span class="inline-flex items-center gap-6"><i data-lucide="file-diff" class="w-16 h-16"></i>src/payments/refund.ts</span>
    <span class="nums"><span class="text-positive">+12</span> <span class="text-critical">−4</span></span>
  </div>
  <pre class="m-0 overflow-x-auto"><code><span class="block px-12 bg-critical/10 text-critical"><span class="select-none opacity-60 mr-8">−</span>  if (amount > 0) charge(amount)</span><span class="block px-12 bg-positive/10 text-positive"><span class="select-none opacity-60 mr-8">+</span>  if (amount > 0 &amp;&amp; idempotent(key)) charge(amount, key)</span><span class="block px-12 text-secondary"><span class="select-none opacity-60 mr-8"> </span>  return receipt</span></code></pre>
</div>
```
For side-by-side, put two `<pre>` columns in a `grid grid-cols-2`. Annotate a specific
line by appending a `Callout` below it (e.g. "왜: 재시도 중복 청구 방지"). HTML-escape
the code (`&lt; &gt; &amp;`). Don't reach for a syntax-highlight lib for a few lines —
plain monospace + the +/− tint reads fine; load highlight.js only for long listings.

## Severity-coded findings list

For reviews, audits, postmortems, eval analysis: a **ranked** list where each item leads
with a severity badge (the `tone` scale doubles as severity: critical > warning(high) >
info(medium) > neutral(low)). Sort highest-severity first; the badge + count is the
scannable headline.

```html
<div x-data="{
  sev:'all',
  // build the chip set from the tones actually present — never a hardcoded list,
  // or a `neutral` ('Low') finding becomes UNREACHABLE (no chip ever shows it).
  // map neutral -> 'Low' so the chip label matches the findings severity label.
  get chips(){
    const present = [...new Set([...document.querySelectorAll('[data-sev]')].map(el=>el.dataset.sev))];
    const order = ['critical','warning','info','neutral'];
    return ['all', ...order.filter(s=>present.includes(s))];
  },
  chipText(s){ return s==='neutral' ? 'Low' : s; },
}">
  <!-- filter by severity (optional) -->
  <div class="flex gap-6 mb-12 text-caption-12">
    <template x-for="s in chips" :key="s">
      <button @click="sev=s" :class="sev===s ? 'bg-accent text-accent-on' : 'bg-disabled-bg text-secondary'"
        class="px-10 py-4 rounded-small capitalize" x-text="chipText(s)"></button>
    </template>
  </div>
  <ul class="space-y-8">
    <!-- one finding; data-sev drives the filter AND feeds the chip set above -->
    <li data-sev="critical" x-show="sev==='all' || sev==='critical'" class="flex gap-12 rounded-medium border border-line-weak bg-surface p-16">
      <span class="inline-flex items-center gap-4 px-8 py-2 h-fit rounded-xxs bg-critical/10 text-critical text-caption-12 font-semibold shrink-0">
        <i data-lucide="octagon-x" class="w-12 h-12"></i>Critical
      </span>
      <div class="min-w-0">
        <p class="text-body-14 font-semibold">환불 경로에 멱등 키가 없어 재시도 시 이중 환불 가능</p>
        <p class="text-caption-12 text-secondary mt-2"><span class="font-mono">refund.ts:42</span> · 재시도 미들웨어가 동일 요청을 두 번 커밋</p>
      </div>
    </li>
    <!-- repeat with bg-cautionary/15 text-cautionary "High", bg-informative/10 "Medium", etc. -->
  </ul>
</div>
```
Build the filter chips from the tones present (`neutral`→`'Low'`), never a fixed
`['all','critical','warning','info']` set — otherwise a `neutral` (Low) finding has no
chip and is unreachable behind the filter.

Lead each finding with **what's wrong + where** (`file:line`), not a vague title. Pair
with the Diff view above when you're proposing the fix.

## Pseudocode / annotated algorithm block

For explaining logic in a PR/code-review or explainer report — represent an algorithm as
clean pseudocode (or real code) with inline annotations, instead of prose.

```html
<div class="rounded-medium border border-line-weak overflow-hidden">
  <div class="px-12 py-8 bg-disabled-bg text-secondary text-caption-12 inline-flex items-center gap-6">
    <i data-lucide="braces" class="w-16 h-16"></i>재시도 백오프 (의사코드)
  </div>
  <pre class="m-0 p-16 font-mono text-caption-12 leading-relaxed overflow-x-auto text-primary"><code>delay ← base
<b>while</b> attempt &lt; max:
  result ← call()
  <b>if</b> result.ok: <span class="text-positive">return result</span>
  sleep(delay + jitter())        <span class="text-secondary">← 동시 재시도 분산</span>
  delay ← min(delay × 2, ceiling) <span class="text-secondary">← 지수 증가, 상한</span>
<span class="text-critical">raise RetriesExhausted</span></code></pre>
</div>
```
Keep keywords bold, annotations in `text-secondary`, and outcomes tone-colored
(`return`→positive, `raise`→critical). Pseudocode beats a paragraph for "how the
algorithm works"; real code beats pseudocode when the reader will copy it.

## Checklist / todo (stateful + export)

A checkable list the reader can tick through — action items, a release checklist, a
migration plan. Because it's *editable*, it must end with a **way out** (copy-as-markdown,
per `interactions.md §13`). Tone the leftover/critical items.

```html
<div x-data="{
  items:[ {t:'멱등 키 추가', done:true}, {t:'환불 경로 재시도 한도', done:false}, {t:'대시보드 알림 임계값', done:false} ],
  get md(){ return this.items.map(i=>`- [${i.done?'x':' '}] ${i.t}`).join('\n') }
}">
  <ul class="space-y-6">
    <template x-for="(i,idx) in items" :key="idx">
      <li class="flex items-center gap-10 rounded-small border border-line-weak bg-surface px-12 py-10">
        <input type="checkbox" x-model="i.done" class="w-16 h-16 accent-accent">
        <span class="text-body-14" :class="i.done && 'line-through text-text-disabled'" x-text="i.t"></span>
      </li>
    </template>
  </ul>
  <div class="mt-12 flex items-center gap-12 text-caption-12 text-secondary">
    <span x-text="items.filter(i=>i.done).length + ' / ' + items.length + ' 완료'"></span>
    <button @click="navigator.clipboard?.writeText(md)" class="px-10 py-4 rounded-small bg-accent text-accent-on">마크다운 복사</button>
  </div>
</div>
```

## Themed SVG flow diagram

A small boxes-and-arrows figure colored from the tokens — the static-HTML port of a
canvas `FlowDiagram`. Use **hand SVG only for ≤ ~6 shapes** (a pipeline, a request flow,
a feedback loop); for anything with real structure use ECharts `graph`/Graphviz/Mermaid
(`libraries.md`). It themes for free (incl. dark) via `var(--accent)` / `var(--c-*)`.

```html
<svg viewBox="0 0 760 160" role="img" aria-label="컨텍스트→아티팩트 흐름" style="width:100%;height:160px;font-family:var(--font-family)">
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0,0 L8,4 L0,8 Z" fill="var(--c-secondary)"/>
    </marker>
  </defs>
  <!-- nodes: surface fill + line stroke so they invert correctly in dark -->
  <g>
    <rect x="16"  y="40" width="160" height="80" rx="12" fill="var(--c-surface)" stroke="var(--c-line)"/>
    <text x="96"  y="76" text-anchor="middle" font-size="13" fill="var(--c-primary)">코드베이스 컨텍스트</text>
    <text x="96"  y="96" text-anchor="middle" font-size="11" fill="var(--c-secondary)">파일 · git · MCP</text>
    <rect x="300" y="40" width="160" height="80" rx="12" fill="var(--c-surface)" stroke="var(--c-line)"/>
    <text x="380" y="76" text-anchor="middle" font-size="13" fill="var(--c-primary)">에이전트 합성</text>
    <text x="380" y="96" text-anchor="middle" font-size="11" fill="var(--c-secondary)">묶기 · 설명 · 비교</text>
    <rect x="584" y="40" width="160" height="80" rx="12" fill="var(--accent-weak)" stroke="var(--accent)"/>
    <text x="664" y="84" text-anchor="middle" font-size="13" fill="var(--accent-strong)" font-weight="600">HTML 아티팩트</text>
  </g>
  <line x1="176" y1="80" x2="298" y2="80" stroke="var(--c-secondary)" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="460" y1="80" x2="582" y2="80" stroke="var(--c-secondary)" stroke-width="1.5" marker-end="url(#arrow)"/>
  <!-- accent feedback loop -->
  <path d="M664 124 C520 156, 240 156, 96 124" fill="none" stroke="var(--accent)" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="380" y="150" text-anchor="middle" font-size="11" fill="var(--c-secondary)">리뷰 피드백이 다음 프롬프트로 되돌아간다</text>
</svg>
```
Use real `<text>` (never paths) so it stays selectable/legible, and **run the visual
self-check** — hand SVG misaligns silently.

## Spatial / quadrant board (absolute positioning)

When the data is **spatial** — a 2×2 priority matrix (effort×impact, risk), a positioning
map — absolute-position the items in a relative box instead of listing them. Gives the
reader a layout that carries meaning. (Keep it to genuinely spatial data; a ranked list
doesn't need a canvas.)

```html
<div class="relative rounded-medium border border-line-weak bg-surface" style="aspect-ratio:16/10">
  <!-- axes -->
  <div class="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
    <div class="border-r border-b border-line-weak"></div><div class="border-b border-line-weak"></div>
    <div class="border-r border-line-weak"></div><div></div>
  </div>
  <span class="absolute left-12 top-8 text-caption-12 text-secondary">높은 임팩트</span>
  <span class="absolute left-12 bottom-8 text-caption-12 text-secondary">낮은 임팩트</span>
  <!-- items: left = effort, bottom = impact; tone = priority -->
  <div class="absolute -translate-x-1/2 -translate-y-1/2" style="left:25%;top:22%">
    <span class="inline-flex items-center gap-4 px-10 py-4 rounded-small bg-positive/10 text-positive text-caption-12 font-medium shadow-sm">멱등 키 (Quick win)</span>
  </div>
  <div class="absolute -translate-x-1/2 -translate-y-1/2" style="left:72%;top:30%">
    <span class="inline-flex items-center gap-4 px-10 py-4 rounded-small bg-cautionary/15 text-cautionary text-caption-12 font-medium shadow-sm">DW 마이그레이션</span>
  </div>
</div>
```
Position with `%` (responsive) and center each node with the `-translate-1/2` trick.
For more than ~10 points or computed coordinates, use an ECharts scatter instead — hand
placement drifts.
