<script lang="ts">
	import { Canvas } from '@threlte/core';
	import HeroScene from './HeroScene.svelte';
	import type { HeroPhoto } from '$lib/types';

	interface Props {
		photos: HeroPhoto[];
		onindexchange?: (index: number) => void;
	}

	let { photos, onindexchange }: Props = $props();

	let currentIndex = $state(0);
	let nextIndex = $state(1);
	let progress = $state(0);
	let isTransitioning = $state(false);
	let pointer = $state({ x: 0.5, y: 0.5 });
	let targetPointer = $state({ x: 0.5, y: 0.5 });
	let canvasEl: HTMLDivElement;
	let autoTimer: ReturnType<typeof setTimeout>;

	const TRANSITION_DURATION = 1500;
	const AUTO_ADVANCE = 6000;

	function ease(t: number): number {
		return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
	}

	function goTo(index: number) {
		if (isTransitioning || index === currentIndex) return;
		clearTimeout(autoTimer);
		nextIndex = ((index % photos.length) + photos.length) % photos.length;
		isTransitioning = true;
		progress = 0;

		const start = performance.now();
		function step(now: number) {
			const t = Math.min((now - start) / TRANSITION_DURATION, 1);
			progress = ease(t);
			if (t < 1) {
				requestAnimationFrame(step);
			} else {
				progress = 0;
				currentIndex = nextIndex;
				nextIndex = (currentIndex + 1) % photos.length;
				isTransitioning = false;
				onindexchange?.(currentIndex);
				scheduleAuto();
			}
		}
		requestAnimationFrame(step);
	}

	function navigate(dir: -1 | 1) {
		const target = ((currentIndex + dir) % photos.length + photos.length) % photos.length;
		goTo(target);
	}

	function scheduleAuto() {
		clearTimeout(autoTimer);
		autoTimer = setTimeout(() => {
			goTo((currentIndex + 1) % photos.length);
		}, AUTO_ADVANCE);
	}

	// Idle drift: subtle Lissajous motion when user hasn't moved the pointer
	let lastInteraction = 0;
	const IDLE_DELAY = 2000;
	const DRIFT_RADIUS = 0.08;

	function onPointerMove(e: PointerEvent) {
		lastInteraction = performance.now();
		const rect = canvasEl?.getBoundingClientRect();
		if (!rect) return;
		targetPointer = {
			x: (e.clientX - rect.left) / rect.width,
			y: 1 - (e.clientY - rect.top) / rect.height,
		};
	}

	function onTouchMove(e: TouchEvent) {
		lastInteraction = performance.now();
		const t = e.touches[0];
		const rect = canvasEl?.getBoundingClientRect();
		if (!rect || !t) return;
		targetPointer = {
			x: (t.clientX - rect.left) / rect.width,
			y: 1 - (t.clientY - rect.top) / rect.height,
		};
	}

	$effect(() => {
		let id: number;
		function tick() {
			const now = performance.now();
			if (now - lastInteraction > IDLE_DELAY) {
				const t = now * 0.0003;
				targetPointer = {
					x: 0.5 + Math.sin(t) * DRIFT_RADIUS,
					y: 0.5 + Math.cos(t * 0.7) * DRIFT_RADIUS,
				};
			}
			pointer = {
				x: pointer.x + (targetPointer.x - pointer.x) * 0.06,
				y: pointer.y + (targetPointer.y - pointer.y) * 0.06,
			};
			id = requestAnimationFrame(tick);
		}
		id = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(id);
	});

	$effect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === 'ArrowRight' || e.key === 'l') navigate(1);
			else if (e.key === 'ArrowLeft' || e.key === 'h') navigate(-1);
		}
		window.addEventListener('keydown', onKey);
		scheduleAuto();
		return () => {
			window.removeEventListener('keydown', onKey);
			clearTimeout(autoTimer);
		};
	});

	let touchStartX = 0;
	function onTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0]?.clientX ?? 0;
	}
	function onTouchEnd(e: TouchEvent) {
		const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX;
		if (Math.abs(dx) > 50) navigate(dx < 0 ? 1 : -1);
	}

	let current = $derived(photos[currentIndex]);
	let next = $derived(photos[nextIndex]);
	let uiOpacity = $derived(isTransitioning ? 0 : 1);
</script>

<div
	class="hero"
	bind:this={canvasEl}
	onpointermove={onPointerMove}
	ontouchstart={onTouchStart}
	ontouchmove={onTouchMove}
	ontouchend={onTouchEnd}
	role="region"
	aria-label="Photo showcase"
>
	<Canvas>
		<HeroScene
			photoA={current}
			photoB={next}
			{progress}
			{pointer}
		/>
	</Canvas>

	<div class="overlay" style:opacity={uiOpacity}>
		<div class="caption">
			<h2>{current.title}</h2>
			{#if current.caption}
				<p>{current.caption}</p>
			{/if}
		</div>
	</div>

	<div class="dots" aria-label="Photo navigation">
		{#each photos as _, i}
			<button
				class="dot"
				class:active={i === currentIndex}
				onclick={() => goTo(i)}
				aria-label="Go to photo {i + 1}"
			></button>
		{/each}
	</div>

	<button class="arrow arrow-left" onclick={() => navigate(-1)} aria-label="Previous">&#8249;</button>
	<button class="arrow arrow-right" onclick={() => navigate(1)} aria-label="Next">&#8250;</button>
</div>

<style>
	.hero {
		position: relative;
		width: 100%;
		height: 100svh;
		overflow: hidden;
		background: #000;
		cursor: none;
	}

	.hero :global(canvas) {
		display: block;
		width: 100% !important;
		height: 100% !important;
	}

	.overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
		transition: opacity 0.6s ease;
		display: flex;
		align-items: flex-end;
		padding: 3rem;
	}

	.caption {
		color: #fff;
		text-shadow: 0 1px 12px rgba(0, 0, 0, 0.8);
	}

	.caption h2 {
		font-size: clamp(1.25rem, 3vw, 2rem);
		font-weight: 300;
		letter-spacing: 0.05em;
		margin-bottom: 0.25rem;
	}

	.caption p {
		font-size: clamp(0.8rem, 1.5vw, 1rem);
		opacity: 0.7;
		font-weight: 300;
	}

	.dots {
		position: absolute;
		bottom: 1.5rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 0.5rem;
		pointer-events: all;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.35);
		border: none;
		cursor: pointer;
		transition: background 0.3s, transform 0.3s;
		padding: 0;
	}

	.dot.active {
		background: #fff;
		transform: scale(1.4);
	}

	.arrow {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.5);
		font-size: 3rem;
		cursor: pointer;
		padding: 1rem;
		transition: color 0.2s;
		line-height: 1;
		user-select: none;
	}

	.arrow:hover {
		color: #fff;
	}

	.arrow-left { left: 0.5rem; }
	.arrow-right { right: 0.5rem; }
</style>
