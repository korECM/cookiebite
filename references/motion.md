# Motion patterns (web-native, self-contained)

Animation is opt-in: add it when it helps the reader (pace a long report, land the
headline number, make a transition legible, explain a process step-by-step) — never
as decoration. Most reports need little more than the built-in CountUp + a subtle
scroll reveal. Reach for GSAP/Lottie only when a moment genuinely earns it. Don't
load these libraries unless you use them.

Everything here stays within the single-file, CDN, no-build contract. (Remotion is
**not** used — it's a React+ffmpeg video-render pipeline, the wrong tool for a
self-contained HTML report.)

## Respect reduced motion (always)
Some readers disable animation at the OS level. Gate non-essential motion so the
report is fully usable without it — content must never *depend* on an animation.
```js
const MOTION_OK = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
// GSAP: gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => { /* tweens */ });
```
With reduced motion, jump elements to their final state (no transition) rather than
hiding them.

> **Verifying AOS / lazy sections:** a single `full-*.png` overview screenshot can
> under-render AOS-revealed or lazy-loaded sections (they shoot before the reveal fires),
> so they look blank or clipped. Trust the **per-scroll tiles** as the source of truth for
> these sections, not the stitched full-page capture.

## 1. Scroll-triggered reveal + count (paces a long report)
Reveal sections/cards as they enter, and start a hero number counting when seen.
Lightweight option: AOS (`data-aos="fade-up"`) + CountUp. **CountUp is auto-loaded by the
template; AOS is NOT** — only CountUp + ECharts ship in the template's chart/KPI
runtime, so add the AOS css/js tags (see `libraries.md`) before using `data-aos`.
Pro option (sequenced, scrubbable): GSAP ScrollTrigger.
```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"></script>
<script>
  gsap.registerPlugin(ScrollTrigger);
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    gsap.utils.toArray('.kpi-card').forEach((el, i) => {
      gsap.from(el, { y:16, opacity:0, duration:0.5, delay:i*0.06,
        scrollTrigger:{ trigger:el, start:'top 85%' } });
    });
  });
</script>
```

## 2. Sequenced intro / hero (GSAP timeline)
Stagger the header + KPI row in once, on load — a single tasteful entrance, not a
loop. Keep it under ~1s total so the reader isn't waiting.
```js
const tl = gsap.timeline({ defaults:{ ease:'power2.out' } });
tl.from('header h1', { y:20, opacity:0, duration:0.5 })
  .from('.kpi-card', { y:16, opacity:0, stagger:0.06, duration:0.4 }, '-=0.2');
```

## 3. Animated chart entrance
ECharts/Chart.js already animate on first render — usually enough. If you want a
chart to animate *when scrolled into view*, init it lazily inside a ScrollTrigger
`onEnter` (or an IntersectionObserver) instead of on load.

## 4. Lottie — rich vector animation
For an expressive hero, an empty-state, a celebratory check, or an explanatory loop,
embed an After Effects/JSON animation. The web component is the simplest:
```html
<script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"></script>
<lottie-player src="https://assets.lottiefiles.com/packages/lf20_xxx.json"
  autoplay loop style="width:160px;height:160px" speed="1"></lottie-player>
```
- Prefer a **hosted URL** or **inline JSON** so the file stays self-contained.
- Recolor to the theme where the JSON allows, or pick a neutral animation — a
  rainbow Lottie breaks the on-theme look just like a rainbow chart palette.
- Use sparingly: one expressive moment per report, not a wall of looping graphics.

## 5. Process / step-by-step build (narrative reports)
For postmortems or how-it-works explainers, reveal a causal chain or pipeline one
step at a time on scroll (ScrollTrigger pinning, or staggered reveals). This makes a
sequence *legible* — a good use of motion, not decoration.

## 6. Animated flow / pipeline diagram (request-flow style)
The ByteByteGo move: a system or request flow drawn as labelled stages, with a packet
that travels stage to stage so the reader *sees* data move through it. Animation earns
its place here — it shows sequence and direction a static box-and-arrow can't. Build it
natively, not as an embedded GIF (a GIF isn't themeable or crisp and dies with its URL).

**Drive the packet AND the stage highlights from one clock**, or they drift out of
sync and it looks broken. The failure mode to avoid: animating the packet with CSS
`ease-in-out` while lighting stages with `animation-delay` — the eased packet speeds up
and slows down, so it no longer reaches each stage at the delay you assumed, and the
highlight fires at the wrong time. The reliable fix is a tiny rAF loop that reads the
packet's real position off the path and lights whichever stage it's nearest. One source
of truth = perfect sync, smooth motion, and you control the per-stage dwell.

```html
<svg viewBox="0 0 760 120" id="flow">
  <path id="route" d="M70 60 H690" fill="none" stroke="var(--c-line)" stroke-width="2"
        stroke-dasharray="6 6"/>
  <!-- stages: <g class="stage" data-at="70"> rect + number + label </g>, data-at = its x on the route -->
  <circle id="packet" r="6" fill="var(--accent)"/>
</svg>
<script>
  const route = document.getElementById('route');
  const packet = document.getElementById('packet');
  const stages = [...document.querySelectorAll('.stage')];
  const len = route.getTotalLength();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DWELL = 0.55, TRAVEL = 0.85;            // seconds paused at a stage / moving between
  const xs = stages.map(s => +s.dataset.at);    // stage x positions, in order

  function place(t){                            // t in [0,1] along the whole route
    const p = route.getPointAtLength(t * len);
    packet.setAttribute('cx', p.x); packet.setAttribute('cy', p.y);
    // light the nearest stage by x — same clock, so it's always in sync
    const x = p.x, near = xs.reduce((b,xx,i)=> Math.abs(xx-x) < Math.abs(xs[b]-x) ? i : b, 0);
    stages.forEach((s,i)=> s.classList.toggle('lit', i === near && Math.abs(xs[i]-x) < 28));
  }

  if (reduce){ place(1); }                       // static end-state, no motion
  else {
    // build an eased timeline: dwell at each stage, ease between them
    const ease = u => u<.5 ? 2*u*u : 1-Math.pow(-2*u+2,2)/2;   // easeInOutQuad
    const seg = []; let acc = 0;
    for (let i=0;i<xs.length;i++){ seg.push(['dwell', acc, acc+DWELL, xs[i]]); acc+=DWELL;
      if (i<xs.length-1){ seg.push(['move', acc, acc+TRAVEL, xs[i], xs[i+1]]); acc+=TRAVEL; } }
    const total = acc, x0 = xs[0], x1 = xs[xs.length-1];
    let start;
    (function loop(ts){ start ??= ts; const tt = ((ts-start)/1000) % total;
      const s = seg.find(s => tt>=s[1] && tt<s[2]);
      const x = s[0]==='dwell' ? s[3] : s[3] + (s[4]-s[3])*ease((tt-s[1])/(s[2]-s[1]));
      place((x - x0)/(x1 - x0));
      requestAnimationFrame(loop);
    })();
  }
</script>
```
```css
.stage rect{ transition: fill .2s; }
.stage.lit rect{ fill: var(--accent-weak); }     /* highlight is a class toggle, driven by the loop */
```

Number the stages and label every node and edge — an animated diagram still has to read
as a freeze-frame. Keep it on-theme (accent packet, neutral lines). Give it a sane pace
(the packet should rest briefly at each stage, not race), and a replay/pause control or
a calm loop so the reader isn't forced to catch it once. For branches/fan-out, run one
loop per packet over its own path; for scroll-scrubbing or a scrubber UI, GSAP
MotionPathPlugin gives you a timeline you can seek.

## Restraint checklist
- Does each animation help the reader understand or find something? If not, cut it.
- One hero/entrance moment max; subtle elsewhere. Total intro motion < ~1s.
- Works fully with `prefers-reduced-motion: reduce` (content visible, no dependence).
- Nothing loops distractingly near text the reader is trying to read.
- Themed (accent/neutral), never a default rainbow.
