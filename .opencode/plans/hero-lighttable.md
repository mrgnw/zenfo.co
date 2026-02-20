# morgan.photos — Hero Showcase + Light Table

## Overview

Two-section photography portfolio page:
1. **Cinematic Hero** — 7 featured photos, fullscreen, with depth-aware transitions and parallax
2. **Light Table** — ~12 curated thumbnails, scroll-driven morph from hero to grid

---

## Hero Images (7)

| File | Title | Why |
|---|---|---|
| `20230708-A7_00042-Edit.jpg` | Lobo de espejo | Wildlife, B&W, moody — depth transition includes hue/saturation shift |
| `20240625-A7_00222-HDR.jpg` | Mossy Sentinel | Nature close-up, green, lush depth layers |
| `20230708-A7_00067.jpg` | Lake in the Clouds | Epic landscape, classic foreground/mid/background |
| `20240627-A7_00077-HDR.jpg` | Mountain Railway | Travel/journey, leading lines + depth |
| `20231008-A7_00156-HDR.jpg` | City Bicycle | Urban, warm autumn light, close subject |
| `20231021-IMG_4709 (1).jpg` | Coastal Palm | Tropical, vivid color, palm foreground + sea bg |
| `20240508-IMG_1615-Pano-2.jpg` | Golden Hour Through the Trees | Architecture, golden light, silhouette |

## Light Table Images (~12)

All 7 heroes + these additional picks:
- `20230706-DJI_0145-HDR-Pano-Edit.jpg` — Patagonian Dusk (aerial landscape)
- `20240628-A7_00040.jpg` — Glacial Inlet (Alaska reflections)
- `20250323-IMG_4925.jpg` — Barcelona Tiles (hexagonal detail — **special hex tile animation**)
- `20230713-DJI_0412.jpg` — Rock and Foam (aerial abstract)
- `20240306-IMG_8457-Pano.jpg` — Gothic Quarter Alley (street/architecture)

---

## Technology Stack

### Philosophy: Use the most modern thing. Fallback to a dissolve.

If a browser doesn't support WebGPU, scroll-driven animations, or View Transitions — they get a simple crossfade. No polyfills, no workarounds. The cutting-edge experience is for cutting-edge browsers.

### Threlte + Three.js — Our rendering foundation

Replaces the hand-rolled WebGL. Threlte gives us:
- **Declarative Svelte components** for 3D scenes (meshes, materials, cameras)
- **Reactive props** — change a texture/uniform with `{value}`, no manual `gl.uniform2f()`
- **Automatic disposal** via Svelte lifecycle, no manual `destroy()`
- **`ShaderMaterial`** for custom GLSL (depth transitions, parallax) via `<T.ShaderMaterial>`
- **`<ImageMaterial>`** from `@threlte/extras` — built-in cover-fit, brightness/contrast/hue/saturation/monochrome, rounded corners, transparency — nearly everything we need for image display with color processing
- **`useTask`** for render loops instead of manual `requestAnimationFrame`
- **`useTexture`** for async texture loading with Suspense support
- **WebGPU renderer** option via `createRenderer` prop + TSL (Three.js Shading Language) for node-based materials — fallback to WebGL automatically

### WebGPU + TSL (Three.js Shading Language)
- Threlte supports `WebGPURenderer` with automatic WebGL fallback
- TSL lets us write shader logic as composable JS nodes instead of raw GLSL strings
- `MeshPhysicalNodeMaterial` with custom `outputNode` for depth-based transitions
- Uniform updates via `$effect()` — fully reactive
- **Fallback**: Three.js WebGPU renderer auto-falls back to WebGL when WebGPU unavailable

### CSS Scroll-Driven Animations
- `animation-timeline: scroll()` / `view()` — bind keyframes to scroll position
- Hero→grid morph, staggered grid reveals, hex tile animation
- **Fallback**: IntersectionObserver-triggered CSS transitions

### View Transition API
- `document.startViewTransition()` for lightbox open/close
- `view-transition-name` on grid thumbnails for per-element morphs
- **Fallback**: Simple opacity crossfade

### CSS `clip-path: polygon()` — Hexagonal masking
- Animatable polygon clips for hex tile reveal
- **Fallback**: Rectangular clip or simple fade

### CSS `@property` — Typed custom properties
- Register `--progress` as `<number>` for animatable custom properties
- Enables things like animating gradient stops, color values via keyframes
- **Fallback**: Just use regular transitions

### Houdini Paint API
- Procedural hex grid pattern as CSS `background: paint(hex-grid)`
- **Fallback**: Static SVG or clip-path approach

---

## Phase 1: Generate Depth Maps

```sh
spatial-maker --output-types depth --model l \
  "static/samples/describe/20230708-A7_00042-Edit.jpg" \
  "static/samples/describe/20240625-A7_00222-HDR.jpg" \
  "static/samples/describe/20230708-A7_00067.jpg" \
  "static/samples/describe/20240627-A7_00077-HDR.jpg" \
  "static/samples/describe/20231008-A7_00156-HDR.jpg" \
  "static/samples/describe/20231021-IMG_4709 (1).jpg" \
  "static/samples/describe/20240508-IMG_1615-Pano-2.jpg"
```

Output depth maps to `static/samples/describe/depth/`.

## Phase 2: Depth Transition Material (Threlte + ShaderMaterial)

A custom `<DepthTransitionMaterial>` Svelte component wrapping `<T.ShaderMaterial>`.

### Architecture

```svelte
<!-- DepthTransitionMaterial.svelte -->
<script>
  // Reactive uniforms — Threlte handles updates automatically
  let { imageA, depthA, imageB, depthB, progress, saturationA, saturationB, pointer } = $props()
</script>

<T.ShaderMaterial
  vertexShader={vertShader}
  fragmentShader={fragShader}
  uniforms={{
    u_image_a: { value: imageA },
    u_depth_a: { value: depthA },
    u_image_b: { value: imageB },
    u_depth_b: { value: depthB },
    u_progress: { value: progress },
    u_saturation_a: { value: saturationA },
    u_saturation_b: { value: saturationB },
    u_pointer: { value: pointer },
  }}
/>
```

Or **if WebGPU is available**, use TSL (Three.js Shading Language):

```ts
// Depth transition as composable TSL nodes
const depthA = texture(u_depth_a, uv)
const pixelProgress = smoothstep(depthA.sub(spread), depthA.add(spread), u_progress)
const blurred = gaussianBlur(u_image_a, uv, pixelProgress.mul(blurAmount))
const result = mix(blurred, texture(u_image_b, uv), pixelProgress)
```

TSL is cleaner than raw GLSL strings and compiles to both WGSL (WebGPU) and GLSL (WebGL fallback).

### Transition algorithm
1. Sample depth from outgoing image at current UV
2. Per-pixel timing: `smoothstep(depth - spread, depth + spread, progress)` — foreground peels first
3. Multi-tap blur on outgoing image (9-tap kernel scaled by pixel_progress)
4. Cross-fade using pixel_progress
5. Saturation lerp for B&W ↔ color (luma-based desaturation in shader)
6. Parallax displacement continues on active image via pointer uniform

### Transition behavior
- Auto-advance: ~6s per photo
- Transition duration: ~1.5s with CSS-like ease-in-out
- B&W wolf: `saturation_a/b` lerps from 0→1 or 1→0 during transition
- Active photo retains parallax pointer-tracking
- During transition: incoming photo's parallax gradually takes over

## Phase 3: Hero Section (`HeroShowcase.svelte`)

Threlte `<Canvas>` filling the viewport with an orthographic camera looking at a fullscreen quad.

```svelte
<Canvas createRenderer={webgpuWithFallback}>
  <T.OrthographicCamera makeDefault position.z={1} />
  <T.Mesh>
    <T.PlaneGeometry args={[2, 2]} />
    <DepthTransitionMaterial
      imageA={currentTexture}
      depthA={currentDepth}
      imageB={nextTexture}
      depthB={nextDepth}
      progress={transitionProgress}
      pointer={pointerPos}
    />
  </T.Mesh>
</Canvas>
```

- Uses `useTexture` from `@threlte/extras` for async loading with Suspense
- Preloads current + next image pair
- Dot indicator at bottom (HTML overlay via `<HTML>` from extras, or plain DOM)
- Title + description overlay fades during transitions
- Keyboard (←/→) + touch swipe navigation
- Auto-advance timer resets on interaction

## Phase 4: Light Table (`LightTable.svelte`)

- ~12 images, dark background (#0a0a0a)
- CSS Grid with `auto-fill` for responsive columns
- Images lazy-loaded with `loading="lazy"` + IntersectionObserver fade-in
- Hover: `filter: brightness(1.2)`, slight `scale(1.03)`, title tooltip
- Click: expand with View Transition API (`document.startViewTransition()`)
  - `view-transition-name` on each thumbnail for per-element morphing
  - Fallback: simple opacity crossfade

### Special: Barcelona Tiles Hex Reveal Effect

The `20250323-IMG_4925.jpg` (2048x1280) has ~12 clearly visible Gaudi hexagonal pavement tiles with regular grout lines and an orange leaf focal point.

**Multi-layer approach: CSS clip-path + scroll-driven + Houdini paint fallback**

1. **Pre-define hex grid coordinates** — Map each tile's center (x%, y%) and size as percentages. The grid is extremely regular — flat-top hexagons in an offset grid.

2. **Create ~12 overlay `<div>` elements**, each:
   - `position: absolute` over the image container
   - `clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)`
   - `background: url(tiles.jpg)` with `background-position` offsetting to show correct slice
   - Initial state: `opacity: 0; transform: scale(0.6) rotateX(40deg); filter: blur(4px)`

3. **Scroll-driven reveal** (modern browsers):
   ```css
   .hex-tile {
       animation: hex-reveal 1s ease-out both;
       animation-timeline: view();
       animation-range: entry 10% entry 60%;
   }
   @keyframes hex-reveal {
       from { opacity: 0; transform: scale(0.6) rotateX(40deg); filter: blur(4px); }
       to   { opacity: 1; transform: scale(1) rotateX(0deg); filter: blur(0); }
   }
   ```
   Each tile gets a unique `animation-range` offset for center-outward stagger.

4. **`@property` for smooth custom easing**:
   ```css
   @property --hex-progress {
       syntax: "<number>";
       inherits: false;
       initial-value: 0;
   }
   ```
   Enables animating gradient overlays, glow effects per-tile.

5. **Houdini Paint API** (Chrome/Edge bonus):
   - Register a `paint(hex-grout)` worklet that draws the dark grout lines procedurally
   - Animates the grout "growing" between tiles as they settle into place
   - Other browsers: just use the image's natural grout lines (look fine already)

6. **Fallback** (no scroll-driven animation support):
   - IntersectionObserver triggers a `.visible` class
   - Simple CSS transition: `opacity 0.6s, transform 0.6s`

**Stagger order**: Center tile (orange leaf) first → ring 1 (6 adjacent) → ring 2 (outer partial tiles). Delay ~100ms between rings.

## Phase 5: Scroll-Driven Morph (Hero → Light Table)

Use CSS scroll-driven animations:

```css
.hero-section {
    view-timeline-name: --hero;
}

.hero-image {
    animation: hero-shrink linear both;
    animation-timeline: --hero;
    animation-range: exit 0% exit 100%;
}

@keyframes hero-shrink {
    from {
        transform: scale(1);
        border-radius: 0;
    }
    to {
        transform: scale(0.15);
        border-radius: 8px;
        opacity: 0.8;
    }
}
```

The WebGL canvas gets `pointer-events: none` and fades out during this transition, while a CSS `<img>` clone of the current hero image takes over for the morph animation (CSS transforms on a static image are cheaper and smoother than trying to animate a WebGL canvas position).

**Sequence:**
1. As hero scrolls out of view, WebGL canvas fades (opacity 0)
2. A positioned `<img>` of the current photo takes its place
3. That `<img>` shrinks and repositions toward its grid slot (scroll-driven)
4. Simultaneously, other grid thumbnails fade in with staggered `animation-range` offsets
5. On scroll back up: reverse animation restores hero

## Phase 6: Page Assembly

```svelte
<main>
    <HeroShowcase {photos} />

    <!-- Scroll transition zone (~50vh) -->
    <div class="transition-zone" />

    <LightTable {photos} {currentHeroIndex} />
</main>
```

- `morgan.photos` branding top-left (persistent)
- Photo info overlay adapts to context (hero shows full description, grid shows title on hover)

---

## Dependencies

```sh
pnpm add three @threlte/core @threlte/extras
pnpm add -D @types/three
```

- `three` + `@threlte/core` + `@threlte/extras` — rendering, `<ImageMaterial>`, `useTexture`, `<HTML>`
- `spatial-maker` (installed) — depth map generation
- Everything else (scroll-driven animations, View Transitions, Houdini, `@property`) is native CSS/JS

### What we can delete
- `src/lib/gl/renderer.ts` — replaced by Threlte
- `src/lib/gl/shaders.ts` — replaced by custom ShaderMaterial or TSL nodes
- `src/lib/components/DepthPhoto.svelte` — replaced by HeroShowcase
- `src/lib/components/DepthSlice.svelte` — replaced or kept as alternate mode

## Files to Create/Edit

| File | Action |
|---|---|
| `src/lib/components/DepthTransitionMaterial.svelte` | New — custom ShaderMaterial for depth crossfade |
| `src/lib/components/HeroShowcase.svelte` | New — Threlte Canvas, 7-photo hero |
| `src/lib/components/LightTable.svelte` | New — CSS grid with View Transitions |
| `src/lib/components/HexReveal.svelte` | New — hex tile stagger for Barcelona Tiles |
| `src/lib/shaders/depth-transition.frag` | New — GLSL fragment shader (or TSL nodes) |
| `src/lib/shaders/depth-transition.vert` | New — GLSL vertex shader |
| `src/routes/+page.svelte` | Edit — replace current gallery |
| `static/samples/describe/depth/` | New — 7 generated depth maps |
| `src/lib/hex-grid.ts` | New — hex coordinate data for the Barcelona Tiles image |

---

## Fallback Strategy

Every cutting-edge feature degrades to a simple dissolve/fade:

| Feature | Full experience | Fallback |
|---|---|---|
| WebGPU + TSL | Node-based shaders, compute | WebGL via Three.js auto-fallback |
| Depth transitions | Per-pixel depth-driven crossfade | Simple opacity crossfade between `<img>` |
| Scroll-driven animations | Scroll-bound hero→grid morph | IntersectionObserver + CSS transitions |
| View Transition API | Morphing thumbnail → lightbox | Opacity fade |
| CSS `@property` | Animated gradient stops, glow | Static values |
| Houdini Paint API | Procedural hex grout animation | Image's natural grout lines |
| `clip-path: polygon()` | Animated hex reveal | `clip-path: inset()` or opacity fade |

Detection:
```js
const hasScrollTimeline = CSS.supports('animation-timeline', 'scroll()')
const hasViewTransitions = 'startViewTransition' in document
const hasPaintWorklet = 'paintWorklet' in CSS
```

## Open Questions

1. **Hex tile coordinates** — Manually map ~12 hex positions from the image as (cx%, cy%, radius%) tuples. A quick Python script with OpenCV edge detection on the grout lines could automate this, but manual mapping of 12 regular hexagons is probably 10 minutes of work.

2. **Image loading strategy** — 12 grid images × ~800KB = ~10MB. Options:
   - Generate 400px-wide thumbnails at build time (Python script or sharp)
   - Use `<img srcset>` with multiple sizes
   - Cloudflare Image Resizing (if enabled on the worker)
   - Load full-size only on lightbox expand

3. **TSL vs raw GLSL** — TSL is cleaner and future-proof but adds complexity if we also want a raw GLSL fallback. Could write in GLSL first (works everywhere via Three.js ShaderMaterial), then optionally port to TSL for WebGPU bonus features later.
