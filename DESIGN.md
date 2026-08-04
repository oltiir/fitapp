---
name: FitApp
description: Knurl & Chalk — a one-handed training log built from the kit that touches your hands.
colors:
  floor: "#0d0c0b"
  deck: "#1a1816"
  deck-open: "#24211d"
  line: "#35302a"
  steel: "#928c82"
  steel-hi: "#b8b1a5"
  chalk: "#f4f1e8"
  chalk-dim: "#a9a29a"
  leather: "#b5763a"
  leather-dim: "#9a6230"
  leather-hi: "#d08f4e"
  leather-ink: "#1a1005"
  stitch: "rgba(26, 16, 5, 0.55)"
  signal: "#f04a41"
  signal-fill: "#c22a24"
  signal-lo: "#46100e"
  # Not paint: CSS mask functions require an opaque black/transparent alpha
  # channel regardless of palette, and this is the rib shading inside a
  # webbing texture, not a hue. Both are structural, not brand.
  mask-black: "#000000"
  webbing-rib: "rgba(0, 0, 0, 0.26)"
typography:
  scale:
    # The enumerated ramp: every figure size that recurs across more than one
    # component without owning a semantic role of its own below.
    micro: "0.72rem" # tab labels, calendar weekday/marks, tag-label caption
    figure-md: "1.35rem" # rail heading, session split header, PR row load
    figure-lg: "1.6rem" # belt tally, rest clock, sticky split header
    figure-xl: "1.9rem" # stepper value — the largest figure, set by thumb
  display-split:
    fontFamily: "Big Shoulders Display, Arial Narrow, Helvetica Neue, sans-serif"
    fontSize: "clamp(3.4rem, 19vw, 5.5rem)"
    fontWeight: 900
    lineHeight: 0.82
    letterSpacing: "-0.03em"
  display-figure:
    fontFamily: "Big Shoulders Display, Arial Narrow, Helvetica Neue, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "'tnum' 1"
  display-action:
    fontFamily: "Big Shoulders Display, Arial Narrow, Helvetica Neue, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "0.06em"
  display-title:
    fontFamily: "Big Shoulders Display, Arial Narrow, Helvetica Neue, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "0.01em"
    # An open band's exercise name steps up to scale.figure-md (1.35rem, 900)
    # instead of owning a second named role — see Typography > Hierarchy.
  display-rule:
    fontFamily: "Big Shoulders Display, Arial Narrow, Helvetica Neue, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.16em"
  display-label:
    fontFamily: "Big Shoulders Display, Arial Narrow, Helvetica Neue, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.12em"
  data-body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  data-facts:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
    fontFeature: "'tnum' 1"
rounded:
  none: "0"
  control: "4px"
  stamp: "2px"
  hole: "50%"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "20px"
  s5: "32px"
  s6: "48px"
  gutter: "16px"
components:
  buckle:
    backgroundColor: "{colors.leather}"
    textColor: "{colors.leather-ink}"
    typography: "{typography.display-action}"
    rounded: "{rounded.control}"
    padding: "0 48px 0 20px"
    height: "58px"
    width: "100%"
  buckle-active:
    backgroundColor: "{colors.leather-dim}"
  buckle-disabled:
    backgroundColor: "{colors.deck}"
    textColor: "{colors.steel}"
  steel-btn:
    backgroundColor: "{colors.deck}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "50px"
    width: "100%"
  steel-btn-sm:
    height: "44px"
    width: "auto"
  steel-btn-danger:
    textColor: "{colors.signal}"
  quiet:
    textColor: "{colors.steel}"
    typography: "{typography.display-label}"
    height: "44px"
    width: "100%"
  band:
    backgroundColor: "{colors.deck}"
    textColor: "{colors.chalk}"
    typography: "{typography.display-title}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
    height: "66px"
    width: "100%"
  band-open:
    backgroundColor: "{colors.deck-open}"
  split-tag:
    backgroundColor: "{colors.deck}"
    textColor: "{colors.chalk-dim}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
    height: "62px"
  split-tag-next:
    backgroundColor: "{colors.deck-open}"
    textColor: "{colors.leather-hi}"
  split-tag-stale:
    textColor: "{colors.signal}"
  stepper-btn:
    backgroundColor: "{colors.deck}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.none}"
    width: "54px"
    height: "62px"
  stepper-value:
    backgroundColor: "{colors.floor}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.none}"
    height: "62px"
  rest-strip:
    backgroundColor: "{colors.deck}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.control}"
    padding: "0 8px 0 12px"
    height: "48px"
    width: "100%"
  input:
    backgroundColor: "{colors.floor}"
    textColor: "{colors.chalk}"
    typography: "{typography.data-body}"
    rounded: "{rounded.control}"
    padding: "12px"
    height: "52px"
    width: "100%"
  tab-item:
    textColor: "{colors.steel}"
    height: "60px"
  tab-item-active:
    textColor: "{colors.chalk}"
  sheet-action-primary:
    textColor: "{colors.leather-hi}"
    height: "48px"
  reading-row:
    textColor: "{colors.chalk}"
    typography: "{typography.display-figure}"
    rounded: "{rounded.none}"
    padding: "8px 0"
    height: "44px"
    width: "100%"
---

# Design System: FitApp

## Overview

**Creative North Star: "Knurl & Chalk — the lifter's worn kit"**

The world is assembled out of the gear that actually touches your hands in a gym: chalk dust on a rubber-crumb floor, the punched holes down a leather belt, knurled steel on a bar, ribbed webbing straps, and one selvedge stripe of red on a wrist wrap. Rubber-black is the ground, chalk-white is the ink, flat saddle leather owns whole regions rather than trimming them, steel hairlines do the dividing, and red is the only signal in the building. It refuses three things by name: the fitness-app card stack, the progress ring, and one electric accent sprinkled over grey.

The mode is **operate**, not browse. The governing scene is one hand, between sets, arm's length, possibly with chalk on your fingers — and that scene wins every tie in this system. Consequences run all the way down: the split you are training is set at singlet scale, the commit action is bolted to the bottom of the screen and never moves, figures are tabular so they don't dance as they change, and there is exactly one authored animation in the whole app. Density is high but the type is large; nothing here is decorative, and there is no ornament that isn't also a piece of information.

Material in this system is **flat and graphic, never simulated**. There is no `box-shadow`, no `text-shadow`, no `backdrop-filter` and no gradient-as-substance anywhere in the build. Tan is flat tan. A stitch is one real 1px dashed line. A punched hole is genuine negative space cut with a CSS mask so the floor shows through it. Depth, where it exists at all, is carried by which ground a region sits on.

**Key Characteristics:**

- Rubber-black ground with chalk-white ink; leather owns whole regions; red appears once per screen at most.
- Bands, never cards: full-bleed rows, no radius, no per-row outline, one hairline between neighbours.
- Punched holes, never rings or dots — a filled hole is a shape change, so state never rides on colour alone.
- Condensed display caps for every name, label and headline figure; system stack with tabular figures for every line of facts.
- Every icon is drawn SVG on one 24-grid at one stroke weight. No glyphs, no emoji, not even for a bullet or an arrow.
- Flat by construction: zero shadows, zero bevels, zero embosses in the entire stylesheet.
- One authored motion (the punch), with a `prefers-reduced-motion` escape.

### Provenance

This direction was **assigned by `impeccable/scripts/concept-seed.mjs`, not chosen by preference**, across two rounds.

- **Round one** — seed key `3fc8fac1`. Seven grounded candidates were ordered by resonance; assigned index 4 was an engineering load-rating spec sheet. Six challengers were dealt, and three were put to the user as named alternates (a nixie-tube laboratory counter, a tensegrity force column, a Labanotation movement score) alongside the standing canon exit. **The user re-rolled**, which eliminated every direction shown.
- **Round two** — seed key `266a2b0e`. Assigned index 4 again, which after the re-roll was "the lifter's worn kit" (belt tooling, singlet numbering, wrap stripes, chalk on black knurl), derived to replace the eliminated candidate. Six challengers were dealt; the three strongest were put to the user as named alternates (Kraftwerk *Man-Machine*, a used-future starship crew terminal, an interactive variable-font specimen) alongside the canon exit. The user chose the assigned direction. That is what shipped, as **Knurl & Chalk**.

On-disk evidence is thin, and future readers should not infer more than it supports. `.impeccable/questions/` holds exactly one answer file, `91c25c20.answer.json`, containing `{"optionId":"assigned","steer":""}`. Round one left only an empty `78eba89b.log`. Seed key `3fc8fac1` appears nowhere on disk. Seed key `266a2b0e` appears in exactly one place: the direction contract comment in `index.html`, which survives the production build (grep `dist/index.html` for `266a2b0e` to confirm). Everything above beyond those artifacts is recorded here because nothing else on disk carries it.

**There is no approved comp, sketch or QUALITY BAR card for this world, and none is expected.** No image generation was available in this environment, and the winning direction was a grounded candidate with no catalog card. Do not go looking for a reference render; `src/styles.css` and this file are the reference.

## Colors

A warm-neutral near-black carrying one warm tan, one bone white and one red — sixteen visual tokens, only three of them hues, plus two structural constants (below) that are not part of the palette proper.

### Primary

- **Saddle Leather** (`{colors.leather}`): flat tan, the material that owns whole regions. It is the commit bar (`.buckle`), the belt strip's strap face, and the rest timer's depleting webbing track. It is never a border colour on a grey component and never a text colour — leather is a *ground* that carries near-black ink. **`{colors.leather-dim}`** is its pressed state. **`{colors.leather-hi}`** is the lit edge: it is what leather looks like as *text* or *stroke* on the black floor (the sheet's primary action, the next-split tag's name, today's calendar ring, the focus outline).
- **Stamped Ink** (`{colors.leather-ink}`): the near-black stamped into tan. Lettering on the buckle, the belt's day initials, the belt's today ring and run dash. Only ever used on a tan ground.

### Secondary

- **Signal Red** (`{colors.signal}`): the only signal in the building, and the wrap's selvedge stripe. It marks a stale split, a personal record, a hazard heading, a validation error, a destructive action once pressed, and a run on the calendar. **Its rarity is the whole point** — see The One Stripe Rule. **`{colors.signal-fill}`** is the darker red used only where red must sit on the chalk-white ground (a run marked on a day you trained). **`{colors.signal-lo}`** exists solely as one band of the `--hazard` diagonal stripe.

### Neutral

- **Rubber Floor** (`{colors.floor}`): the page ground, and the `theme-color` of the installed PWA. Deliberately warm-neutral rather than blue-black — chalk and leather are both warm, and a cool ground makes both look dirty. It also fills the inside of an unfilled punched hole, and the recessed field of an input or a stepper's value.
- **Deck** (`{colors.deck}`): the ground of a band at rest, and of a steel plate control.
- **Open Deck** (`{colors.deck-open}`): the ground of the band you are working in, and of the next-up split tag. This is the *only* mechanism that marks an active band. See The Ground Marks It Rule.
- **Hairline** (`{colors.line}`): 1px rules and quiet control borders. At 1.5:1 on the floor it is structure, never information.
- **Chalk** (`{colors.chalk}`): primary ink, 17.3:1 on the floor. Also the fill of a punched-and-plugged hole, and the chalk line of every chart.
- **Chalk Dim** (`{colors.chalk-dim}`): secondary ink at 7.74:1 on the floor. The default for a line of facts and a calendar date.
- **Steel** (`{colors.steel}`): tertiary ink for labels and idle controls, 5.86:1 on the floor and 4.80:1 on `{colors.deck-open}` — the open band's ground, where a label like `.cur-label` actually sits. Secondary text has to clear both. **`{colors.steel-hi}`** (9.19:1 on the floor) is the brighter steel used on a section rule heading.
- **Stitch** (`{colors.stitch}`): the only translucent colour in the visual palette, and it exists for exactly one job — the dashed hairline that reads as thread on tan.

### Structural (not palette)

- **Mask Black** (`{colors.mask-black}`): pure `#000`, used only inside a CSS `mask-image`/`-webkit-mask-image` function, where the mask channel requires opaque black regardless of the visual palette. Never painted; never appears as a colour a user sees. Where `mask-composite` is unsupported, the masked element's layers union and it renders as solid tan instead — the device is lost, nothing breaks.
- **Webbing Rib** (`{colors.webbing-rib}`): the shading inside the `--webbing` texture (a repeating rib every 4px). It is a *texture modulation* on top of a real ground colour, not a new hue, and it is intentionally excluded from the visual palette above — treating it as a "colour" would double-count a rib that never appears without a base tone under it.

### Named Rules

**The One Stripe Rule.** Red is the only signal colour and appears at most once per screen. If a screen already has a stale split tag, it does not also get a red heading. If a red thing is not something the user needs to react to — a record, a staleness warning, an unrecoverable action, an error — it should not be red.

**The Ground Marks It Rule.** An active, open or selected region is marked by changing its **ground** (`{colors.deck}` → `{colors.deck-open}`), never by adding a border, a glow or an accent bar. A border on a band would make it a card.

**The Warm Ground Rule.** Every neutral in this palette is warm. Never introduce a blue-black, a cool grey or a pure `#000`/`#fff`; they make chalk look grimy and leather look plastic.

**The Second Cue Rule.** Colour never carries state on its own. A done set is a *filled* hole (`.holes .pin.filled`), not a green one. A stale split gets red text, a red border **and** a notched top-right corner (`.tag.stale::after`, a 13px triangle). A personal record gets a stamp with a drawn arrow in it. Audit test: desaturate the screen — every state must still be readable.

**The Ink Belongs To Its Ground Rule.** Each red has a ground it is allowed on: `{colors.signal}` on the floor (5.36:1), `{colors.signal-fill}` on chalk (5.09:1). Swapping them fails — `{colors.signal}` on chalk is 3.23:1 and `{colors.signal-fill}` on the floor is 3.40:1, and both were rejected during the build. The same rule governs tan: `{colors.leather-ink}` on `{colors.leather}` measures 5.01:1, which is why `{colors.leather-hi}` exists for text *on* the floor rather than reusing `{colors.leather}`.

## Typography

**Display Font:** Big Shoulders Display — a variable face with a 400–900 weight axis, **self-hosted** from `src/fonts/big-shoulders-display.woff2` (35 KB, `font-display: swap`), with `Arial Narrow` and `Helvetica Neue` as condensed fallbacks. Self-hosting is load-bearing: the app must boot fully offline from a service worker, so there is no font CDN to reach.

**Body / Data Font:** the platform system stack (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `system-ui`), always with tabular figures where it carries numbers.

**Character:** a condensed athletic face at heavy weights, set in caps with wide tracking for names and labels and negative tracking for big figures — the lettering off a singlet, a weight plate and a belt stamp. Against it, the system face is deliberately plain: it is there to be read, not to be styled.

### Hierarchy

- **Display / Split** (900, `clamp(3.4rem, 19vw, 5.5rem)`, line-height 0.82, `-0.03em`, caps): the one hero on Today — the split you are training. Nothing else in the app is set at this scale.
- **Display / Figure** (900, line-height 1, `-0.02em`, tabular): every headline number, drawn from three enumerated steps in `typography.scale` — `figure-md` (1.35rem: the rail heading, the session split header, a PR row's load), `figure-lg` (1.6rem: the belt tally, the rest clock, a reading's value, a split's days-since), and `figure-xl` (1.9rem: a stepper's value, the largest of the family because it is the thing you adjust with a thumb).
- **Display / Action** (900, 1.22rem, `0.06em`, caps): the commit bar's lettering, and only the commit bar's.
- **Display / Title** (800, 1.02–1.7rem, `0.01–0.06em`, caps): a name — an exercise on a band (1.12rem, going to 1.3rem when the band opens), the session's split in the sticky head (1.7rem), a notice heading, a sheet title, the date on the top rail (1.35rem).
- **Display / Rule** (700, 0.95rem, `0.16em`, caps): a section marker. Renders as heading + hairline, with an optional value parked at the far right end of the rule.
- **Display / Label** (700, 0.7–0.86rem, `0.12–0.14em`, caps): every label, field label, tab, segmented tab, and set number. This is the widest-tracked type in the system.
- **Data / Body** (400, 16px, line-height 1.45): running prose and every input. **Inputs may never drop below 16px** — iOS zooms the whole page on focus below that, and the zoom does not come back.
- **Data / Facts** (400, 0.875–0.9rem, tabular): a line of facts. Set in the data face on every screen without exception.

### Named Rules

**The Two Voices Rule.** The display face carries **names, labels and headline figures**. The system stack carries **any line of facts**. A sentence that states facts is data wherever it appears, so the same sentence never changes typeface between screens — Today's status line and Progress's recap footer are both `.facts`, both in the data voice. When in doubt: is it a *label on* something (display) or a *statement about* something (data)?

**The No Kicker Rule.** No label ever sits above a heading. Not an eyebrow, not a kicker, not a "NEXT UP" over the split name. State goes **on the heading's own line or on the line beneath it**, where a fact belongs anyway. This is not a stylistic preference; it is enforced by the fact that the system has no such component and adding one back is a regression.

**The Tabular Rule.** Any figure that changes in place — a clock, a load, a count, a delta — is tabular (`font-variant-numeric: tabular-nums` plus `font-feature-settings: 'tnum' 1`). A number that shifts its own layout while counting down is unreadable at arm's length.

**The Two-Letter Mark Rule.** A split stamped onto a day is two letters: `PS`, `PL`, `LG` (`SPLIT_MARK` in `src/types.ts`). Push and pull both abbreviate to `P`, which made two of the three splits indistinguishable in the exact two views whose entire job is telling you which day was which — the belt strip and the month calendar. Any future single-letter abbreviation must survive the same test.

**"Stencilled" was struck, not faked.** The direction contract originally described this lettering as stencilled. The self-hosted face has **no stencil bridges**, so the word was prose the render did not back. The ruling was to correct the wording in the contract rather than fake the device with a background trick or ship a raster stencil face against the offline-boot budget. Do not reintroduce the word, and do not simulate the bridges.

**Spell the term out when the face fights it.** The display face's `1` has no flag and no foot, so `e1RM` rendered as "eIRM" at label size; the reading is labelled "Est. one-rep max" instead. Check any new all-caps label containing a `1`, an `I` or an `l`.

## Layout

**One column, centred, 460px.** The app is a single flex column (`.app`) at `max-width: var(--app-w)` = 460px, centred with `margin: 0 auto`. On a wide screen the column stays 460px and the **floor runs full bleed** behind it, because `--floor` is painted on `body`. There is no desktop layout, no sidebar and no multi-column state; a wider viewport gets a wider floor, not a wider app.

Everything fixed to the viewport re-centres itself to the same column with `left: 50%; transform: translateX(-50%); width: 100%; max-width: var(--app-w)` — the tab bar, the dock and the sheet all do this. Copy that idiom for anything new that pins to the viewport, or it will hug the left edge of a wide screen.

**Gutter and full bleed.** `.screen` carries a 16px gutter (`--pad`). A band group cancels it with `margin: 0 calc(var(--pad) * -1)` so bands reach both edges of the column. That negative margin is the only sanctioned way to break the gutter.

**Spacing rhythm.** Six steps — 4, 8, 12, 20, 32, 48px (`--s1`…`--s6`). It is a 4px scale up to 12 and then roughly 1.5× per step, which keeps small gaps tight and section breaks generous. The 16px gutter is deliberately *not* one of the six steps; it is the screen's own inset.

**Reserved heights, never measured.** Three fixed heights hold the layout still: `--tabbar-h` 60px, `--dock-h` 168px, `--app-w` 460px. `.screen` reserves `calc(var(--tabbar-h) + env(safe-area-inset-bottom) + var(--s5))` at its foot; `.session-screen` reserves `calc(var(--dock-h) + env(safe-area-inset-bottom))`. `--dock-h` is sized for the *resting* dock so that starting or ending a rest never shifts the list behind it.

**Safe areas are mandatory.** The app is installed to the iOS home screen with no browser chrome. `.app` and `.sheet` pad `env(safe-area-inset-top)`; the tab bar, the dock and the sheet body pad `env(safe-area-inset-bottom)`. Any new fixed or full-screen surface must do the same.

**Stacking order.** 20 = the session's sticky head, 30 = the tab bar, 40 = the dock, 100 = a sheet. Keep new surfaces inside that ladder rather than inventing a higher number.

**Touch targets.** 44px is the hard floor for anything tappable, and most controls sit well above it: 46px a ruled row, 50px a steel button, 58px the commit bar, 62px a stepper and a split tag, 66px a band row. A control that computes to less than 44px is a bug.

**Screen anatomy.** Every screen opens with a top rail (`.rail`: where on the left, when/summary on the right, hairline underneath). Sections below it are opened by a ruled heading (`.rule`). Because a rule already draws a line across the screen, the block immediately after one has its own top border removed — otherwise the two land 8px apart and read as a seam rather than a division.

**A session takes the whole screen.** When a workout is open the tab bar is not rendered at all (`src/App.tsx`), so a mis-tap cannot navigate out of a session mid-set. The app still always *opens* on Today; an unfinished session shows as a resume band, not an auto-open.

### Named Rules

**The Dock Never Leaves Rule.** On the session screen the commit action is bottom-anchored inside `.dock` and is present in **every** state, rest included. An earlier build swapped the button for the rest timer, which made "Skip" the only route back to the primary action for most of a session. Rest is a slim strip *above* the button, and the dock's height is fixed, so neither state moves the other.

## Elevation & Depth

**There are no shadows in this system.** Not one `box-shadow`, `text-shadow`, `filter` or `backdrop-filter` exists in the entire codebase. There is no shadow vocabulary to reference, and adding the first one is a change to the world, not a tweak.

Depth is carried by three things only:

1. **Ground.** Three flat values step from the page inward: `{colors.floor}` (the page and any recessed field), `{colors.deck}` (a band at rest, a steel plate), `{colors.deck-open}` (the band you are working in). A recessed input is `{colors.floor}` *darker* than the deck around it, which is the whole depth cue.
2. **Hairlines.** One 1px `{colors.line}` rule divides neighbours. Never two, never a thicker one.
3. **Real negative space.** A punched hole is genuinely cut out with a CSS mask; the floor showing through it *is* the depth.

**Material is flat and graphic, never simulated.** A first pass built all five substances (rubber, chalk, leather, webbing, steel) out of `linear-gradient` and `box-shadow`, and the result read as vinyl; a finish review returned a rebuild directive on exactly that. The shipped system therefore has **no gradient standing in for a fill, no inset highlight standing in for a bevel, and no emboss standing in for tooling**. The buckle's earlier bevel made it read as moulded plastic and is gone.

Four gradients survive, and all four are *textures or cuts*, not substances:

- `--knurl` — two 1px cross-hatched `repeating-linear-gradient`s at ±45°, chalk at 8% opacity. Real knurl on a flat steel plate: the secondary button, the stepper buttons, and a disabled commit bar.
- `--webbing` — a 1px vertical rib at 26% black, every 4px. **Reserved for actual webbing only**: the band ground (`.strap`) and the rest timer's depleting track. Ribbing every tan region made leather read as corduroy and left "saddle leather" resting on hue alone. Leather is flat and stitched; webbing is ribbed.
- `--hazard` — 9px diagonal stripes of `{colors.signal-lo}` on near-black. Used for exactly one thing: data you cannot get back.
- `radial-gradient` **as a mask**, never as paint — see Shapes.

### Named Rules

**The Flat Material Rule.** A material is expressed by its **ground colour, its 1px texture, its stitch line and its cut holes** — never by a gradient fill, a highlight, a bevel or a shadow. If a new surface needs to feel physical, give it a real texture token or a real stitch; do not light it.

**The Webbing Stays On Webbing Rule.** `--webbing` goes on webbing and nothing else. `--knurl` goes on steel and nothing else. Tan is always flat.

## Shapes

**Rectangles by default, discs for holes, 4px only on free-standing controls.**

- **`{rounded.none}` (0)** — bands, band rows, steppers, and any button that sits *inside* a band (`.strap-foot button`). A band has no radius by definition, and nothing rounded may nest inside one.
- **`{rounded.control}` (4px)** — the `--r` token, and the only general radius in the system. It appears **only on a free-standing control**: the commit bar, a steel button, a split tag, the rest strip, a rest chip, an input, a hazard block.
- **`{rounded.stamp}` (2px)** — the inked rubber stamp only.
- **`{rounded.hole}` (50%)** — every hole, plug, pin, calendar day and dot. Circles in this system are always holes, never containers.

**The punched hole is the signature form**, and it is genuinely die-cut rather than drawn:

- **The belt strip** (`.belt .strap-face`) removes seven holes with one repeating `radial-gradient` mask tile — `circle 11px at 50% 68%`, `mask-size: calc(100% / 7) 100%`, `repeat-x` — so the floor shows through each day column. The chalk plugs live in a **sibling layer** (`.belt .plugs`), because a child of a masked element is masked away along with it. That constraint is structural: any new mark on the belt goes in the sibling layer.
- **The commit bar** (`.buckle`) punches a tongue slot (`ellipse 3.5px 10px`) and one hole (`circle 4.5px`) at its strap end, composited with `mask-composite: intersect` / `-webkit-mask-composite: source-in`. It was three evenly spaced circles first; on a full-width control they read as an overflow menu — "•••" sitting on the primary action.
- **A stitch** is `border-top`/`border-bottom: 1px dashed {colors.stitch}` inset 4px. One real dashed line. No bevel.

**Graceful degradation.** The die-cut depends on `mask-composite`. Where it is unsupported the mask layers **union to solid tan**: the device is lost, nothing breaks, and no fallback is needed. Do not add one.

**Motion.** One authored animation exists: `punch` — 420ms on `--ease` (`cubic-bezier(0.16, 1, 0.3, 1)`), scaling a committed set's pin `0.35 → 1.24 → 1`, the chalk plug landing and settling. Beyond it there are exactly two transitions in the build: the commit bar's background on press (120ms) and the rest track's depletion (980ms linear, matched to the 1s tick). Nothing animates on entrance. `prefers-reduced-motion: reduce` collapses every animation and transition to 0.01ms and kills the rest track's transition outright.

### Named Rules

**The Die-Cut Rule.** A hole is cut, not drawn. Use a mask that removes the material so the ground behind shows through; do not draw a floor-coloured circle on top of a surface and call it a hole. The one sanctioned exception is a set pip (`.holes .pin`), which sits directly on a band and so *is* a floor-coloured disc with a hard rim — the hole itself, not a shaded impression of one.

**The No Ring Rule.** State is a **filled hole**, never a ring, arc, donut or progress circle. The belt strip exists specifically to replace a progress ring: a ring gives one number, the belt gives that number *and* which days, which split, and where today sits, in the same space and legible at arm's length.

## Components

### Commit bar (`.buckle`) — the primary action

The signature control: a full-width strap of flat tan with near-black lettering stamped into it, one dashed stitch running its length, and a genuinely punched tongue slot and hole at the right end.

- **Shape:** 4px radius (`{rounded.control}`), 58px minimum height, full width, asymmetric padding (`0 48px 0 20px`) so the centred label clears the punched strap end.
- **Colour:** `{colors.leather}` ground, `{colors.leather-ink}` lettering, 900-weight display caps at 1.22rem / `0.06em`.
- **Press:** ground drops to `{colors.leather-dim}` over 120ms. No lift, no scale.
- **Disabled:** stops being leather entirely — `{colors.deck}` ground with `--knurl`, `{colors.steel}` text, and the stitch fades to 10% chalk. A disabled buckle is a steel blank, not a faded belt.
- **Content:** it always contains `<span class="stitch" aria-hidden="true" />` as its first child.
- **Placement:** one per screen, and on the session screen it lives in the dock. Its label changes with the state of the workout — `Log set N`, then the next exercise's name with a drawn `next` icon, then a drawn tick plus `Finish workout` — but the control never disappears.

### Steel button (`.steel-btn`) — the secondary action

A flat steel plate with real knurl on it.

- **Shape:** 4px radius, 50px min height, full width; `.sm` drops to 44px and `width: auto` for use inline in a band or notice.
- **Colour:** `{colors.deck}` ground + `--knurl`, `{colors.chalk}` text, `{colors.line}` border, 800-weight display caps at 1rem / `0.08em`.
- **Press:** ground to `{colors.deck-open}`. **Disabled:** `{colors.steel}` text at 0.55 opacity.
- **Danger:** `.danger` recolours the text to `{colors.signal}` and softens the border to 40% red. It does not fill.
- **Pairs:** two secondary actions side by side use `.btn-pair`, a `1fr 1fr` grid with an 8px gap.

### Quiet button (`.quiet`) — the tertiary action

Text only, no ground, no border, 44px tall, `{colors.steel}` display caps at `0.12em`, brightening to `{colors.chalk}` on press. This is where "went, don't log", "undo" and "discard" live. `.quiet.danger` is red text and nothing else.

### Icon button (`.icon-btn`)

44×44 minimum, no ground, no border, `{colors.steel}`, brightening to `{colors.chalk}` on press. **`.icon-btn.danger` stays quiet until pressed** and only then turns red — a column of red crosses down a list of weigh-ins reads as an alarm, not an affordance. Disabled drops to 0.3 opacity.

### Band (`.strap` inside `.bands`) — the container, and the thing a card is not

The workhorse. Full width of the column, no radius, no outline of its own, one hairline to its neighbour, `{colors.deck}` ground with the `--webbing` rib.

- **Row** (`.strap-row`): 66px min height, 8px/16px padding, a 1.12rem display-caps name that truncates with an ellipsis, and a tabular summary on the right.
- **Open** (`.strap.open`): ground changes to `{colors.deck-open}` — *only* the ground. The name grows to 1.3rem and is allowed to wrap onto a second line, because the exercise you are working on is the one you need to read from arm's length.
- **Body** (`.strap-body`): 16px side padding, 12px bottom.
- **Ruled sub-block** (`.tooled`): last time's numbers, ruled off top and bottom with hairlines rather than embossed into a rounded inset.
- **Nothing rounded nests inside a band.** `.strap-foot button` explicitly sets `border-radius: 0` for this reason.

### Split tag (`.tag`)

Three side-by-side tooled tags on Today, one per split; each reports days-since **and** starts that split, because one control doing both jobs beats a status line plus a separate button.

- **Shape:** 4px radius, 62px min height, a `1fr 1fr 1fr` grid with an 8px gap.
- **Default:** `{colors.deck}` ground, `{colors.line}` border, `{colors.chalk-dim}` name in display caps, a 1.45rem tabular figure with a small `{colors.steel}` unit suffix.
- **Next up** (`.next`): border to `{colors.leather}`, ground to `{colors.deck-open}`, name to `{colors.leather-hi}`.
- **Stale** (`.stale`): red border, red name, red figure, **and** a 13px notched top-right corner cut with `clip-path`. Three cues, so none of them has to be colour.

### Belt strip (`.belt`) — the signature component

The week as a punched leather belt: one die-cut hole per day, a chalk plug stamped with the split mark in the days you trained, a chalk dash under a day you ran, a 1.5px `{colors.leather-ink}` ring around today, and the week's score as a single 1.6rem figure beside it. 60px tall, four absolutely positioned layers over one masked strap face (face → stitch → day initials → plugs). Geometry is arithmetic, not eyeballed: the mask cuts at 68% of 60px = 40.8px, so a 22px plug centres at `top: 30px`.

### Set pips (`.holes .pin`)

The same punched language at set scale, on the collapsed band row: 11px discs, `{colors.floor}` fill with a `{colors.line}` rim when empty, `{colors.chalk}` when done, `{colors.leather}` with a `{colors.leather-hi}` rim for the set you are on. Committing a set adds `.punched` for the one authored animation. This is the app's done-state, and it is a shape change, not a colour change.

### Stepper (`.stepper`)

The number you adjust with a thumb: two 54×62px knurled steel buttons flanking a 62px value that is itself a button. Zero radius, shared hairlines (the value's left and right borders are removed so the three pieces read as one machined part). The value is 1.9rem display, 800 weight, tabular — the largest figure in the app after the hero. Tapping it swaps in a text input that **selects its existing contents on focus**; without that, typing 85 over a prefilled 80 gives 8085, which becomes a permanent bogus PR.

### Rest strip (`.rest`)

A slim 48px strip in the dock, above the commit bar, never replacing it. `{colors.deck}` ground, 4px radius, a 1.6rem tabular clock, a tracked-out label. Its 7px-tall `.track` at the foot is `{colors.leather}` + `--webbing` and depletes by `transform: scaleX()` over 980ms linear. At zero (`.rest.over`) the border and the track both go `{colors.chalk}` and the rib drops away, and the label changes to "Go" — brightness *and* wording, not colour. Duration is chosen from a row of real 44px choices (`.rest-pick`), because cycling six values one tap at a time cost up to five taps to get from 45s to 3:00.

### Readings (`.readings` / `.reading`)

The system's answer to a row of big-number tiles, which is the hero-metric template and reads the same on every product in the category. A reading is a 44px ruled row: a tracked-out `{colors.steel}` display label on the left, a hairline leader stretching across the middle, a 1.5rem tabular display figure on the right. **Every label in a readings stack takes the same voice** — one sentence-case row among tracked-out caps reads as a rendering fault, not an editorial choice.

### Section rule (`.rule`)

A heading, a hairline that fills the remaining width, and an optional value parked at the far right end of the rule (`.rule .val`). Putting the value at the end of the rule rather than on its own line beneath stops it reading as a second heading repeating the first.

### Stamp (`.stamp`)

An inked rubber stamp: a 1.5px red outline, 2px radius, 800-weight red display caps at `0.14em`, rotated −3°, always containing a drawn arrow icon. **Only where something was actually achieved** — a new record. Stamping every row that shared the newest date put six identical stamps on screen, and a stamp on everything marks nothing; only the single most recent record is stamped.

### Notices (`.band-notice` / `.hazard`)

- **`.band-notice`** is the ordinary notice: hairlines top and bottom, no ground, an icon, a display-caps heading and a `.sub` line, and usually a `.steel-btn.sm` on the right. `.live` recolours its rules to `{colors.leather}`.
- **`.hazard`** is reserved for **data you cannot get back**: an 8px diagonal `--hazard` stripe across the top of a bordered block, a `{colors.deck}` interior, a red display-caps heading. Do not use it for an ordinary warning.

### Fields (`input`, `select`, `.field`)

Recessed `{colors.floor}` ground inside a `{colors.line}` hairline, 4px radius, 52px min height, full width, 16px data-face text with tabular figures. The label above sits in `.field label` — tracked-out steel display caps. Focus is a **2px `{colors.leather-hi}` outline at 2px offset**, applied through `:focus-visible` to inputs, selects and buttons alike; it is the only focus treatment in the system. Errors are `{colors.signal}` text in `.err` beneath the field.

### Navigation (`.tabbar`)

Four equal columns, 60px plus the bottom safe area, fixed and re-centred to the 460px column, opaque `{colors.floor}` with a hairline on top. A tab is a drawn 23px icon over a 0.7rem display-caps label. Idle is `{colors.steel}`; `aria-current="page"` goes `{colors.chalk}` **and** grows a 26×2px chalk bar along the top edge of the tab. Two cues again.

### Segmented (`.segmented`)

Not a pill group: a horizontally scrollable row of tracked-out display-caps tabs sitting on a hairline, 46px tall, with the scrollbar hidden. `aria-selected="true"` goes `{colors.chalk}` and lays a 2px chalk underline over the hairline at `bottom: -1px`. No ground, no border, no radius.

### Sheet (`.sheet`)

**Full-screen, not a bottom sheet, and this is deliberate.** On iOS the keyboard covers the bottom of the screen — which hid the Save button — and `position: fixed` elements jump while the keyboard animates, which let the tab bar paint over the sheet. So: `position: fixed; inset: 0`, re-centred to 460px, opaque `{colors.floor}`, rendered through a portal to `document.body` so it can never be trapped in a scrolling or transformed ancestor, with the page behind locked (`body { overflow: hidden }`).

Its header is a `1fr auto 1fr` grid: Cancel on the left in steel, the title centred in display caps, the primary action right-aligned in 900-weight `{colors.leather-hi}`. **Actions live in the header**, always reachable whatever the keyboard is doing.

### Chart (`.chart` in `.plot`)

A chalk line drawn on the rubber ground, deliberately unboxed: hairline grid rules, `{colors.steel}` display-face axis labels at 9px, a 2.2px `{colors.chalk}` polyline with **mitred joins and square caps** to match the icon system, 2.2px dots. No frame, no fill, no rounded container, no area gradient. The band it sits in (`.plot`) is a pair of hairlines top and bottom. It uses a fixed 320-unit internal coordinate space scaled by `viewBox`, so it fills its band at any width with no measurement and no resize observer. X labels are **anchored by position** (`start` / `middle` / `end`) rather than always centred — centring clipped the edge labels against the viewBox and rendered "Jul 27" as "Jul 2".

### Calendar (`.cal`)

A month of punched holes on a `repeat(7, 1fr) 18px` grid — the week-count column is **reserved, not `auto`**, because seven `1fr` day columns took all the width and clipped the count against the screen edge. A day is a 1:1 disc: `{colors.floor}` with a hairline when nothing happened, filled `{colors.chalk}` with `{colors.floor}` ink when you showed up, and a 2px `{colors.leather-hi}` border for today.

**The date always shows, at a legible size and contrast.** It is 12.5px (0.78rem) and clears 7.5:1 on both grounds — 7.74:1 as `{colors.chalk-dim}` on the floor, 7.58:1 as 72%-opacity floor ink on a filled hole. That value replaced a 9.6px / 3.2:1 version that failed the finish review, and a variant that expressed "future day" by fading the date, which pushed it to 1.5:1. **A future day is told apart by having no mark, never by fading its date.** Replacing the date with the split initial was also tried and rejected: it made attended days impossible to locate by date.

### Icons (`src/components/Icon.tsx`)

Twenty-two paths, one 24×24 grid, one stroke weight (1.75), `fill: none`, `stroke: currentColor`, **square caps and mitred joins** — the world is steel hardware, not rounded outlines. Default render size 22px; `strokeWidth` may be overridden only for icons drawn much larger or smaller than that. Colour comes from `currentColor` in every case.

### Named Rules

**The Bands, Never Cards Rule.** The default container is a band: full-bleed, `{rounded.none}`, no per-row outline, one hairline between neighbours, and an active state marked by its ground. If you catch yourself giving a row a radius, a border on all four sides, or a gap between it and the next row, you have built a card and left the world.

**The Drawn, Never Glyphed Rule.** Every **mark** in the interface is a drawn SVG on the 24-grid. No mark falls back to a unicode character or emoji — not a bullet, not an arrow, not a tick. Unicode renders differently on every platform and cannot inherit stroke weight, and it was what made an earlier build read as unfinished. This is why `.dot-mark` exists as a 5px drawn disc where a `•` would have gone, and why the `→` that once separated two figures was dropped rather than typed. The line is between a *mark* and *punctuation*: the middot in "Bench press · set 3" and the `×` in "80 × 8,8,7" are punctuation inside a sentence and are fine. A character doing an icon's job is not.

**The Label Never Changes Rule.** A control keeps its name. Due-ness, staleness or attention is expressed by a **mark added to the control** — a 7px `.due-dot` — never by rewriting its label. A control that renames itself is harder to find than one that adds a marker.

## Do's and Don'ts

### Do:

- **Do** build a new region as a **band**: full-bleed via `margin: 0 calc(var(--pad) * -1)`, `{rounded.none}`, one hairline to its neighbour, active state by ground (`{colors.deck}` → `{colors.deck-open}`).
- **Do** put state **on the heading's line or the line beneath it**, in `.facts`, in the data voice.
- **Do** give every state a second, non-colour cue — a fill, a notch, a shape change, a wording change.
- **Do** use the display face for names, labels and headline figures, and the system stack with tabular figures for any line of facts.
- **Do** cut a hole with a mask so the ground shows through, and put anything that sits *in* the hole in a **sibling** layer.
- **Do** keep the commit action bottom-anchored and present in every state on the session screen, at a fixed `--dock-h`.
- **Do** re-centre anything `position: fixed` to the 460px column (`left: 50%; transform: translateX(-50%); max-width: var(--app-w)`), and pad the relevant `env(safe-area-inset-*)`.
- **Do** keep every tappable target at 44px or more, and every input at 16px or more.
- **Do** draw any new mark as a path in `Icon.tsx`, on the 24-grid, at stroke 1.75 with square caps and mitred joins.
- **Do** check a new colour pair against its actual ground before shipping it — this palette has red-on-floor and red-on-chalk variants for exactly that reason.
- **Do** reuse `--knurl` for steel, `--webbing` for webbing, a dashed `{colors.stitch}` hairline for leather, and leave tan flat.

### Don't:

- **Don't** add a shadow, a bevel, an inset highlight, an emboss, a blur or a gradient-as-fill. The build has none, and the first one is a rebuild directive waiting to happen.
- **Don't** put a label, kicker or eyebrow above a heading.
- **Don't** nest anything rounded inside a band, or give a band a radius or a four-sided border.
- **Don't** express progress as a ring, arc or donut. The punched belt strip is the pattern.
- **Don't** let colour be the sole carrier of any state.
- **Don't** use a unicode character or emoji as an icon, bullet, tick or arrow.
- **Don't** put `--webbing` on tan, or `--knurl` on leather.
- **Don't** introduce a cool grey, a blue-black, a pure `#000` or a pure `#fff`.
- **Don't** add a second red, a second signal colour, or more than one red thing per screen.
- **Don't** animate anything on entrance, or add a second authored motion; if you must, give it a `prefers-reduced-motion` escape.
- **Don't** hide a primary action behind the iOS keyboard — a modal's actions go in its header, and it is full-screen, not a bottom sheet.
- **Don't** abbreviate a split to one letter, or set an all-caps label containing `1`/`I`/`l` without checking it in the display face.
- **Don't** rename a control to signal state; add a mark to it.
- **Don't** add a `mask-composite` fallback. Where it is unsupported the layers union to solid tan, the device is lost, and nothing breaks.
- **Don't** copy the belt's `opacity: 0.62` onto any new ink-on-tan text. On the belt's day initials it computes to ~2.9:1, which is under the floor; it survives only because those letters are `aria-hidden` decoration repeated in the accessible label. New ink-on-tan text runs at full opacity.
