<script lang="ts">
	// Barcelona Tiles image: 20250323-IMG_4925.jpg — 2048×1280
	// Flat-top hexagonal grid. Tile dims: ~340px wide × 294px tall (as % of image)

	interface Props {
		src: string;
		alt?: string;
	}

	let { src, alt = '' }: Props = $props();

	// (cx, cy) = tile center as % of full image dimensions
	const tiles = [
		// Row 0 — top partial tiles
		{ cx: 8,   cy: 10,  ring: 2 },
		{ cx: 24,  cy: 2,   ring: 2 },
		{ cx: 41,  cy: 10,  ring: 2 },
		{ cx: 57,  cy: 2,   ring: 2 },
		{ cx: 74,  cy: 10,  ring: 2 },
		{ cx: 90,  cy: 2,   ring: 2 },
		// Row 1 — middle
		{ cx: 8,   cy: 46,  ring: 1 },
		{ cx: 24,  cy: 38,  ring: 1 },
		{ cx: 41,  cy: 46,  ring: 0 }, // focal — orange leaf
		{ cx: 57,  cy: 38,  ring: 1 },
		{ cx: 74,  cy: 46,  ring: 1 },
		{ cx: 90,  cy: 38,  ring: 1 },
		// Row 2 — bottom partial tiles
		{ cx: 8,   cy: 82,  ring: 2 },
		{ cx: 24,  cy: 74,  ring: 2 },
		{ cx: 41,  cy: 82,  ring: 2 },
		{ cx: 57,  cy: 74,  ring: 2 },
		{ cx: 74,  cy: 82,  ring: 2 },
		{ cx: 90,  cy: 74,  ring: 2 },
	];

	const W = 17;    // tile bounding-box width as % of container
	const H = 23.5;  // tile bounding-box height as % of container

	// Flat-top hexagon (8 points to get proper flat sides)
	const hexClip = 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)';

	const ringDelay = [0, 200, 420];

	let wrapEl = $state<HTMLElement | null>(null);

	// Fallback for browsers without CSS scroll-driven animations
	$effect(() => {
		if (!wrapEl || CSS.supports('animation-timeline', 'view()')) return;
		const obs = new IntersectionObserver(([entry]) => {
			if (entry?.isIntersecting) {
				wrapEl?.classList.add('visible');
				obs.disconnect();
			}
		}, { threshold: 0.1 });
		obs.observe(wrapEl);
		return () => obs.disconnect();
	});
</script>

<div class="hex-wrap" role="img" aria-label={alt} bind:this={wrapEl}>
	<img class="bg" {src} {alt} loading="lazy" />

	{#each tiles as tile}
		{@const left = tile.cx - W / 2}
		{@const top = tile.cy - H / 2}
		{@const delay = ringDelay[tile.ring] ?? 0}
		<div
			class="tile"
			style:left="{left}%"
			style:top="{top}%"
			style:width="{W}%"
			style:height="{H}%"
			style:clip-path={hexClip}
			style:--delay="{delay}ms"
		>
			<img
				class="tile-img"
				{src}
				{alt}
				style:width="{(100 / W) * 100}%"
				style:left="-{(left / W) * 100}%"
				style:top="-{(top / H) * 100}%"
			/>
		</div>
	{/each}
</div>

<style>
	.hex-wrap {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: #000;
	}

	.bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: brightness(0.12);
		transition: filter 1s ease;
	}

	.hex-wrap:hover .bg {
		filter: brightness(0.25);
	}

	.tile {
		position: absolute;
		overflow: hidden;
		will-change: transform, opacity;
		animation: tile-in 0.6s cubic-bezier(0.34, 1.4, 0.64, 1) both;
		animation-delay: var(--delay);
		animation-timeline: view();
		animation-range: entry 0% entry 65%;
	}

	/* Fallback for browsers without scroll-driven animations */
	@supports not (animation-timeline: view()) {
		.tile {
			animation: none;
			opacity: 0;
			transform: scale(0.5) rotateY(90deg);
			filter: blur(8px);
			transition:
				opacity 0.6s cubic-bezier(0.34, 1.4, 0.64, 1),
				transform 0.6s cubic-bezier(0.34, 1.4, 0.64, 1),
				filter 0.6s ease;
			transition-delay: var(--delay);
		}
		:global(.hex-wrap.visible) .tile {
			opacity: 1;
			transform: none;
			filter: none;
		}
	}

	@keyframes tile-in {
		from {
			opacity: 0;
			transform: scale(0.5) rotateY(90deg);
			filter: blur(8px);
		}
		to {
			opacity: 1;
			transform: scale(1) rotateY(0deg);
			filter: blur(0);
		}
	}

	.tile-img {
		position: absolute;
		height: auto;
		display: block;
		aspect-ratio: 2048 / 1280;
		transition: transform 0.4s ease;
	}

	.tile:hover .tile-img {
		transform: scale(1.06);
	}
</style>
