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
For side-by-side, put two `<pre>` columns in a `grid grid-cols-2`. **Keep diff lines
short** — a long line clips off the right edge in the 390px narrow pass (the `<pre>`
scrolls itself, so the content past the edge is invisible without horizontal scroll).
Prefer trimming the code, or move a line's explanation into a `Callout` below it (e.g.
"왜: 재시도 중복 청구 방지") rather than tacking a long inline annotation onto the line.
The verify script now excludes these self-scrolling code blocks from its overflow check,
so a wide `<pre>` won't trip a false alarm — but the reader still can't see what clips, so
keep it narrow. HTML-escape the code (`&lt; &gt; &amp;`). Don't reach for a
syntax-highlight lib for a few lines — plain monospace + the +/− tint reads fine; load
highlight.js only for long listings.

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
(`return`→positive, `raise`→critical). **Keep lines short** — like the diff, a long
pseudocode line clips off the right edge in the 390px narrow pass (the `<pre>` scrolls
itself, so the verify script excludes it from the overflow check, but the reader still
can't see what clips). Move long inline annotations into a `Callout` below the block.
Pseudocode beats a paragraph for "how the algorithm works"; real code beats pseudocode
when the reader will copy it.

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

## Key-takeaway box (TL;DR summary)

The single most-requested element for exec/explainer reports and the "get the point in
5 seconds" rule: a scannable 3–5 bullet summary at the **top** of the report, often
tone-coded (2 wins, 1 risk). Distinct from a `Callout` — a callout is one highlight; this
is a multi-point summary. Accent-weak surface + accent-strong title.

```html
<div class="rounded-medium bg-accent-weak border border-line-weak p-20 mb-24">
  <p class="text-caption-12 font-semibold text-accent-strong uppercase tracking-wide mb-10">핵심 요약</p>
  <ul class="space-y-8 text-body-14">
    <li class="flex gap-8"><span class="w-6 h-6 mt-6 rounded-full bg-positive shrink-0"></span>결제 성공률 97.1%로 전주 대비 +1.4%p 개선</li>
    <li class="flex gap-8"><span class="w-6 h-6 mt-6 rounded-full bg-positive shrink-0"></span>환불 처리 시간 중앙값 2.3일 → 1.1일</li>
    <li class="flex gap-8"><span class="w-6 h-6 mt-6 rounded-full bg-cautionary shrink-0"></span>naverpay 채널 타임아웃이 여전히 임계값 초과</li>
  </ul>
</div>
```
The title uses **`text-accent-strong`** (accent-as-text on a light surface needs the
stronger token for AA contrast), while the surface stays `bg-accent-weak`. Dot the bullets
with tone colors and **pair with a word** if the dot carries meaning — a bare green dot
fails the color-alone rule. **Runtime fast path — `CB.takeaway(pointsOrHtml, { title? })`**
returns this box as a string (pass an array of bullet strings or raw HTML); see
`helpers.md`.

## Faceted card grid (filter a collection by 1–2 facets)

Survey responses (by segment), roadmap initiatives (by quarter/team/status), research
items (by method/confidence), retro action-items (by owner/status) — collections you want
to filter by one or two facets at once, kept as cards (not flattened to a table). The
single-axis segment chips in `interactions.md §1` filter one variable; this AND-combines
the union of each item's tags. **The chip row MUST wrap or scroll** (`flex flex-wrap`) —
a bare `flex` row of 8 facet chips runs off the right edge and breaks the page at 390px
(`interactions.md §1` rule).

```html
<div x-data="{
  active:'all',
  // build the facet set from the tags actually present (union), never hardcoded
  get facets(){ return ['all', ...new Set([...document.querySelectorAll('[data-tags]')].flatMap(el=>el.dataset.tags.split(',')))]; },
  match(el){ return this.active==='all' || el.dataset.tags.split(',').includes(this.active); }
}">
  <!-- chip row: wraps so it never overflows on phones -->
  <div class="flex flex-wrap gap-6 mb-12 text-caption-12">
    <template x-for="f in facets" :key="f">
      <button @click="active=f" :class="active===f ? 'bg-accent text-accent-on' : 'bg-disabled-bg text-secondary'"
        class="px-10 py-4 rounded-small capitalize" x-text="f"></button>
    </template>
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-16">
    <!-- one card; data-tags drives BOTH the filter and the facet set above -->
    <div data-tags="Q1,Backend" x-show="match($el)" class="bg-surface border border-line-weak rounded-medium p-16">
      <p class="text-body-16 font-semibold">멱등 키 도입</p>
      <p class="text-caption-12 text-secondary mt-2">재시도 이중 청구 차단</p>
      <div class="flex flex-wrap gap-4 mt-8">
        <span class="px-8 py-2 rounded-xxs bg-disabled-bg text-secondary text-caption-12">Q1</span>
        <span class="px-8 py-2 rounded-xxs bg-disabled-bg text-secondary text-caption-12">Backend</span>
      </div>
    </div>
    <!-- repeat cards with their own data-tags -->
  </div>
</div>
```
Build the chip set from the tags present (the union), never a fixed list — same reason as
the findings filter. **Runtime fast path — `CB.cardGrid(target, { items, caption? })`**
where each item is `{ title, body?, tags?, meta? }`; it builds the wrap/scroll chip row
from the tag union for you (see `helpers.md`).

## Status board / lanes (read-only kanban, Now/Next/Later)

Sprint retros and roadmap one-pagers often want a static 3–4 column board — status lanes
(To-do / In-progress / Done) or Now / Next / Later — that a timeline and the quadrant
board don't give. Keep it **read-only** (no drag): a draggable triage board is product UI,
out of scope. Pure Tailwind grid, tone-pilled cards, a per-column count.

```html
<div class="grid grid-cols-1 sm:grid-cols-3 gap-16">
  <!-- one lane -->
  <div class="rounded-medium bg-disabled-bg/50 p-12">
    <div class="flex items-center justify-between mb-10">
      <span class="text-body-14 font-semibold">Now</span>
      <span class="px-8 py-2 rounded-xxs bg-disabled-bg text-secondary text-caption-12 nums">2</span>
    </div>
    <div class="space-y-8">
      <div class="bg-surface border border-line-weak rounded-small p-12 shadow-sm">
        <p class="text-body-14 font-medium">멱등 키 추가</p>
        <span class="inline-flex items-center gap-4 px-8 py-2 mt-6 rounded-xxs bg-cautionary/15 text-cautionary text-caption-12 font-medium">
          <i data-lucide="alert-triangle" class="w-12 h-12"></i>진행 중
        </span>
      </div>
      <div class="bg-surface border border-line-weak rounded-small p-12 shadow-sm">
        <p class="text-body-14 font-medium">재시도 한도 적용</p>
      </div>
    </div>
  </div>
  <!-- Next / Later lanes: same structure -->
</div>
```
Stacks to one column below `sm`. Tone the cards with the `tone` contract (status pill), and
pair each colored pill with its label. For a roadmap, the lanes are Now / Next / Later; for
a retro, To-do / In-progress / Done.

## Collapsible rich section (`<details>` — fold away depth)

The companion to the takeaway box for explainers/postmortems: fold away a block of **rich
HTML** (a deep-dive, a raw log excerpt, detailed remediation steps), not just one text
string (the `interactions.md §5` accordion binds plain `x-text`). Native `<details>` needs
**zero JS**, holds arbitrary HTML, prints expanded, and themes from the tokens.

```html
<details class="rounded-medium border border-line-weak bg-surface group">
  <summary class="flex items-start justify-between gap-12 px-16 py-12 cursor-pointer select-none list-none">
    <!-- title WRAPS (min-w-0 + no truncate) so a long summary stays fully readable on a
         phone; the chevron is shrink-0 so it never gets squeezed off -->
    <span class="text-body-16 font-semibold min-w-0">재시도 로직 상세 분석: 백오프·지터·상한과 동시 재시도 분산</span>
    <i data-lucide="chevron-down" class="w-16 h-16 shrink-0 mt-2 text-secondary transition-transform group-open:rotate-180"></i>
  </summary>
  <div class="px-16 pb-16 pt-2 text-body-14 text-secondary space-y-8">
    <p>백오프는 지수적으로 증가하되 상한을 둡니다. 동시 재시도를 분산하기 위해…</p>
    <ul class="list-disc pl-20"><li>base = 200ms</li><li>ceiling = 8s</li></ul>
    <!-- a sub-chart, a diff block, anything -->
  </div>
</details>
```
`list-none` hides the default triangle so your own chevron carries the affordance;
`group-open:rotate-180` flips it. **Let the summary title wrap — don't `truncate` it.** A
`truncate` on a `<summary>` title clips the text to one line with an ellipsis, which on a
narrow phone hides most of the title (and the reader can't hover to see the rest); wrap it
instead (`min-w-0` on the title + `shrink-0` on the chevron, as above) so the full title
stays readable at 390px. If you collapse a **chart**, init it lazily on first open
(or `resize()` on the `toggle` event) — a chart inside a closed `<details>` measures 0×0,
the same footgun as a hidden tab (`interactions.md §6`). For an Alpine version that folds
rich children, swap the §5 accordion's `x-text="item.detail"` for child markup under the
`x-collapse` div.

## Footnotes & citations (provenance for research/postmortems)

Research write-ups and postmortems need sources (change tickets, GMV estimates,
dashboards). A `<sup>` ref in prose that jumps to a numbered note with a return link —
themed, with matched ids so the jump never silently breaks.

```html
<!-- inline reference in prose -->
<p class="text-body-14">주간 GMV는 ₩24.2억으로 추정됩니다<sup id="fnref1"><a href="#fn1"
  class="text-accent-strong no-underline px-2">[1]</a></sup>.</p>

<!-- the notes list (bottom of the report / section) -->
<ol class="mt-24 pt-16 border-t border-line-weak space-y-6 text-caption-12 text-secondary">
  <li id="fn1" class="flex gap-6">
    <span class="text-secondary nums">1.</span>
    <span>Looker 대시보드 #482, 2026-06-13 스냅샷.
      <a href="#fnref1" class="text-accent-strong no-underline" aria-label="본문으로 돌아가기">↩</a></span>
  </li>
  <!-- #fn2, #fn3 … each with a matching #fnrefN return link -->
</ol>
```
Keep the ref id (`fnref1`) and note id (`fn1`) paired — a mismatch silently breaks the
jump with no error. The ref uses **`text-accent-strong`** (accent-as-text). For a looser
"Sources" block use a `Callout` (tone `info`) with a list of links instead of numbered
footnotes.

## Annotated chart markers (markLine / markArea / markPoint)

Reference lines are what turn a chart from "here's data" into "here's the point" — an
average, a target, an SLO threshold, a launch-date window. Drop them on any
series. **Color from RESOLVED theme values** (`CB.theme.ACCENT`, `CB.css('--c-*')`,
`CB.accentRgba(a)`) — `var(--*)`/`color-mix` render black on the canvas (`libraries.md`).

```js
COOKIEBITE.chart('#trend', {
  ariaLabel: '일별 매출, 목표선·평균선 표시',
  caption: '금·토에 매출이 몰리며 목표선을 상회',
  option: {
    xAxis: { type: 'category', data: ['월','화','수','목','금','토','일'] },
    yAxis: { type: 'value' },
    series: [{
      type: 'line', data: [82, 78, 90, 95, 140, 152, 110], smooth: true,
      markLine: {
        symbol: 'none',
        // label positioned 'start' (LEFT) so it never clips off the right edge
        label: { position: 'start', color: CB.css('--c-secondary') },
        data: [
          { type: 'average', name: '평균', lineStyle: { color: CB.css('--c-line'), type: 'dashed' } },
          { yAxis: 120, name: '목표', lineStyle: { color: CB.theme.ACCENT, type: 'dashed' } },
        ],
      },
      markArea: {  // event window (e.g. a promo) as a tinted band
        itemStyle: { color: CB.accentRgba(0.08) },
        data: [[{ xAxis: '금' }, { xAxis: '토' }]],
      },
      markPoint: {  // call out the peak
        symbolSize: 44, itemStyle: { color: CB.theme.ACCENT },
        data: [{ type: 'max', name: '최대' }],
      },
    }],
  },
});
```
**Position `markLine` labels `start` (the left edge), not the default end** — a right-edge
label clips off the chart on narrow viewports (the known failure). Use a dashed neutral
line for an average/baseline and the **accent** for the line that carries the point
(target/threshold); don't accent both or the emphasis is lost.

---

## Editorial components (lead, callouts, figure, quotes, kicker, status, legend)

A second family beyond the data blocks above: **editorial** components for narrative /
explainer / longform reports — the parts that make a report read like an article, not a
dashboard. They all return the **shared `.cb-*` contract classes** (styled by
`cookiebite.css`) and speak the same `tone` language; the runtime fast-path is in
`helpers.md` (the `CB.lead`/`CB.note`/… signatures). Use them when prose carries the
report; reach for the data blocks above when numbers do.

| Component | Runtime | When to use | Tone |
|-----------|---------|-------------|------|
| **Lead / standfirst** | `CB.lead(html, {measure?,dropcap?})` | the opening paragraph of a section/report — larger, looser than body, sets up what follows | — (no tone) |
| **Callout family** | `CB.note/tip/warning/danger/example(html,{title?})` | an admonition with a **fixed role** — a caveat (`warning`), a hint (`tip`), an aside (`note`), a hazard (`danger`), a worked case (`example`) | fixed per variant: note→info, tip→success, warning→warning, danger→critical, example→neutral |
| **Quote (inline)** | `CB.quote(html,{cite?})` | a short pulled sentence inside the flow, with attribution | — |
| **Epigraph** | `CB.epigraph(html,{cite?})` | a small italic **opening** quotation above a section | — |
| **Pullquote** | `CB.pullquote(html)` | a **large** lift-out quotation that breaks up a long passage | — (accent glyph) |
| **Figure** | `CB.figure(target,{number?,title,note?,source?})` | wrap a chart/table/image with a numbered `Fig. N` caption + source provenance | — |
| **Kicker / lead-in** | `CB.kicker(text,{tone?})` + `.cb-leadin` class | a section eyebrow above an `<h2>` (kicker) / a small-caps run-in opening a paragraph (`.cb-leadin`, hand-applied) | optional |
| **Status dot** | `CB.statusDot(tone,label,{pulse?,size?})` | a live status indicator (service state, build health) — dot **plus** a required label | the dot's color |
| **What-changed** | `CB.whatChanged(target,items,{title?})` | a small config/metric **before→after** value diff (old struck → new + Δ badge) | per-row, colors the Δ |
| **Legend (standalone)** | `CB.legend(target,items,{swatch?,interactive?,chart?})` | a value-bearing / interactive legend for a multi-series chart, richer than ECharts' built-in | swatch colors (categorical palette) |

**The tone contract still governs.** Every editorial component that carries status uses
the same five-name scale from the top of this file — the **callout family hard-wires** its
tone per variant (`warning`→warning, `danger`→critical, `tip`→success, `note`/`example`→
info/neutral), so you pick the *variant* by meaning and the color follows. `statusDot`,
`whatChanged`, and `kicker` take an explicit `tone`; **never color-alone** — `statusDot`
*requires* a text label and `whatChanged` pairs its Δ color with an up/down arrow + sign.
`lead`/`quote`/`epigraph`/`pullquote`/`figure` are tone-free (typographic, not status).

> **Readability defaults (`.cb-prose` / `.cb-lead`).** `.cb-lead` and `.cb-prose` clamp
> their line length to `--measure-prose` (default 68ch; `.cb-lead` falls back to 58ch) so
> longform body text stays readable instead of running the full page width. `CB.lead(…,
> {measure:false})` opts a paragraph out (full-bleed `.cb-bleed`) when you *want* it wide.
> The measure is a Look knob (`--measure-prose`) — see `design-system.md`.

## A second skeleton: explainer / postmortem (NOT a dashboard)

The template ships **one** worked demo — a payments/weekly-metrics dashboard. Don't let it
anchor every report to KPI-cards-plus-trend-chart (the exact "generic AI dashboard" the
skill warns against). Many report types are **narrative**: a postmortem, an explainer, a
research write-up. Their backbone is *takeaway → how it works → what we found*, composed
from the blocks above — no KPI row required.

```html
<main class="max-w-[860px] mx-auto px-20 py-32 space-y-24">
  <header>
    <p class="text-caption-12 text-secondary uppercase tracking-wide">Postmortem · 2026-06-18</p>
    <h1 class="text-headline-36 font-bold mt-2">Checkout 502s during the Friday promo</h1>
  </header>

  <!-- 1. Key-takeaway box (the 5-second summary) -->
  <div class="rounded-medium bg-accent-weak border border-line-weak p-20">
    <p class="text-caption-12 font-semibold text-accent-strong uppercase tracking-wide mb-10">TL;DR</p>
    <ul class="space-y-8 text-body-14">
      <li class="flex gap-8"><span class="w-6 h-6 mt-6 rounded-full bg-critical shrink-0"></span>A connection-pool exhaustion under promo load returned 502s for ~14 min.</li>
      <li class="flex gap-8"><span class="w-6 h-6 mt-6 rounded-full bg-positive shrink-0"></span>Mitigated by raising the pool ceiling; no data loss.</li>
      <li class="flex gap-8"><span class="w-6 h-6 mt-6 rounded-full bg-cautionary shrink-0"></span>Root fix (per-route limits + autoscale) lands next sprint.</li>
    </ul>
  </div>

  <!-- 2. How it works / what happened — a diagram instead of a wall of text -->
  <section>
    <h2 class="text-title-24 font-bold mb-12">Request path</h2>
    <div id="flow"></div>
    <script>
      CB.mermaid('#flow', `flowchart LR
        U[User] --> LB[Load balancer] --> APP[Checkout svc] --> POOL[(DB pool)] --> DB[(Postgres)]`);
    </script>
  </section>

  <!-- 3. What we found — the severity-coded findings list -->
  <section>
    <h2 class="text-title-24 font-bold mb-12">Findings</h2>
    <div id="findings"></div>
    <script>
      CB.findings('#findings', [
        { tone:'critical', title:'DB pool ceiling (20) too low for promo concurrency', where:'db.ts:31', note:'Requests queued past the 5s timeout → 502.' },
        { tone:'warning',  title:'No per-route concurrency limit', where:'router.ts', note:'One slow route starved the whole pool.' },
        { tone:'info',     title:'Alert fired 6 min late', where:'monitors/latency', note:'p95 threshold set too high.' },
      ]);
    </script>
  </section>
</main>
```
That's a complete report shape with **zero** KPI cards or trend bars: a takeaway box, a
diagram, and findings. Add a `<details>` deep-dive, a timeline of the incident, or
footnotes for sources from the sections above. Reach for KPI cards + a chart only when the
report is genuinely metric-driven.
