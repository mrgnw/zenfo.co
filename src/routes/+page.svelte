<script lang="ts">
	import DepthPhoto from '$lib/components/DepthPhoto.svelte';
	import DepthSlice from '$lib/components/DepthSlice.svelte';
	import { onMount } from 'svelte';

	const photos = [
		{
			slug: 'mountain-lake',
			title: 'Mountain Lake',
			caption: 'Alpine reflections',
			src: '/samples/sample.jpg',
			depthSrc: '/samples/sample-depth.jpg',
			aspect: 1.5,
		},
		{
			slug: 'mountain-lake-2',
			title: 'Golden Hour',
			caption: 'Last light on the peaks',
			src: '/samples/sample.jpg',
			depthSrc: '/samples/sample-depth.jpg',
			aspect: 1.5,
		},
		{
			slug: 'mountain-lake-3',
			title: 'Still Water',
			caption: 'Dawn at the lake',
			src: '/samples/sample.jpg',
			depthSrc: '/samples/sample-depth.jpg',
			aspect: 1.5,
		},
	];

	let currentIndex = $state(0);
	let mode = $state<'parallax' | 'focus'>('parallax');
	let uiVisible = $state(true);
	let stripOpen = $state(false);
	let galleryEl: HTMLDivElement;
	let slideEls: HTMLDivElement[] = [];

	let photo = $derived(photos[currentIndex]);

	function scrollTo(index: number) {
		slideEls[index]?.scrollIntoView({ behavior: 'smooth' });
	}

	function navigate(dir: -1 | 1) {
		const next = currentIndex + dir;
		if (next >= 0 && next < photos.length) scrollTo(next);
	}

	function toggleMode() {
		mode = mode === 'parallax' ? 'focus' : 'parallax';
	}

	onMount(() => {
		let fadeTimer: ReturnType<typeof setTimeout>;

		function resetFade() {
			uiVisible = false;
			clearTimeout(fadeTimer);
			fadeTimer = setTimeout(() => {
				uiVisible = true;
			}, 2500);
		}

		function onMouseMove() {
			resetFade();
		}

		function onKeyDown(e: KeyboardEvent) {
			if (e.key === 'ArrowDown' || e.key === 'j') {
				e.preventDefault();
				navigate(1);
			} else if (e.key === 'ArrowUp' || e.key === 'k') {
				e.preventDefault();
				navigate(-1);
			} else if (e.key === ' ') {
				e.preventDefault();
				toggleMode();
			}
		}

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('keydown', onKeyDown);

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const idx = slideEls.indexOf(entry.target as HTMLDivElement);
						if (idx !== -1) currentIndex = idx;
					}
				}
			},
			{ root: galleryEl, threshold: 0.5 }
		);

		for (const el of slideEls) {
			if (el) observer.observe(el);
		}

		return () => {
			clearTimeout(fadeTimer);
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('keydown', onKeyDown);
			observer.disconnect();
		};
	});
</script>

<svelte:head>
	<title>morgan.photos</title>
</svelte:head>

<div class="gallery" bind:this={galleryEl}>
	{#each photos as p, i}
		<div class="slide" bind:this={slideEls[i]}>
			{#if mode === 'focus' && i === currentIndex}
				{#key `focus-${i}`}
					<DepthSlice src={p.src} depthSrc={p.depthSrc} alt={p.title} />
				{/key}
			{:else}
				{#key `parallax-${i}`}
					<DepthPhoto
						src={p.src}
						depthSrc={p.depthSrc}
						alt={p.title}
						aspect={p.aspect}
						intensity={0.02}
						fill
					/>
				{/key}
			{/if}
		</div>
	{/each}
</div>

<div class="overlay" style:opacity={uiVisible ? 1 : 0}>
	<span class="name">morgan.photos</span>

	<div class="info">
		<h2>{photo.title}</h2>
		{#if photo.caption}
			<p>{photo.caption}</p>
		{/if}
	</div>

	<div class="controls">
		<span class="counter">{currentIndex + 1} / {photos.length}</span>
		<div class="mode-toggle">
			<button
				class="mode-btn"
				class:active={mode === 'parallax'}
				onclick={() => { mode = 'parallax'; }}
			>
				Parallax
			</button>
			<button
				class="mode-btn"
				class:active={mode === 'focus'}
				onclick={() => { mode = 'focus'; }}
			>
				Focus
			</button>
		</div>
		<button class="grid-toggle" onclick={() => { stripOpen = !stripOpen; }}>
			⊞
		</button>
	</div>
</div>

<div class="thumb-strip" class:open={stripOpen}>
	{#each photos as p, i}
		<button class="thumb-btn" onclick={() => { scrollTo(i); stripOpen = false; }}>
			<img
				class="thumb"
				class:active={i === currentIndex}
				src={p.src}
				alt={p.title}
			/>
		</button>
	{/each}
</div>

<style>
	.gallery {
		height: 100vh;
		overflow-y: scroll;
		scroll-snap-type: y mandatory;
		scroll-behavior: smooth;
	}

	.slide {
		height: 100vh;
		width: 100vw;
		scroll-snap-align: start;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.slide :global(canvas) {
		width: 100vw !important;
		height: 100vh !important;
	}

	.overlay {
		position: fixed;
		inset: 0;
		z-index: 10;
		pointer-events: none;
		transition: opacity 0.6s ease;
	}

	.overlay > :global(*) {
		pointer-events: auto;
	}

	.name {
		position: absolute;
		top: 1.5rem;
		left: 1.5rem;
		font-size: 0.8rem;
		font-weight: 300;
		letter-spacing: 0.15em;
		color: var(--color-text-muted);
	}

	.info {
		position: absolute;
		bottom: 2rem;
		left: 2rem;
	}

	.info h2 {
		font-size: 1rem;
		font-weight: 400;
		letter-spacing: 0.05em;
	}

	.info p {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		margin-top: 0.25rem;
	}

	.controls {
		position: absolute;
		bottom: 2rem;
		right: 2rem;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.counter {
		font-size: 0.75rem;
		color: var(--color-text-dim);
		font-variant-numeric: tabular-nums;
	}

	.mode-toggle {
		display: flex;
		gap: 2px;
		background: rgba(255, 255, 255, 0.06);
		border-radius: 6px;
		padding: 2px;
	}

	.mode-btn {
		all: unset;
		font-size: 0.65rem;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		color: var(--color-text-dim);
		cursor: pointer;
		transition: all 0.2s;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.mode-btn:hover {
		color: var(--color-text-muted);
	}

	.mode-btn.active {
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-text);
	}

	.grid-toggle {
		all: unset;
		cursor: pointer;
		color: var(--color-text-dim);
		font-size: 0.9rem;
		padding: 0.25rem;
		transition: color 0.2s;
	}

	.grid-toggle:hover {
		color: var(--color-text);
	}

	.thumb-strip {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 20;
		background: rgba(0, 0, 0, 0.85);
		backdrop-filter: blur(10px);
		padding: 0.5rem 1rem;
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		transform: translateY(100%);
		transition: transform 0.3s ease;
	}

	.thumb-strip.open {
		transform: translateY(0);
	}

	.thumb-btn {
		all: unset;
		cursor: pointer;
	}

	.thumb {
		width: 48px;
		height: 48px;
		border-radius: 4px;
		object-fit: cover;
		opacity: 0.5;
		transition: opacity 0.2s;
		border: 1px solid transparent;
		display: block;
	}

	.thumb:hover {
		opacity: 0.8;
	}

	.thumb.active {
		opacity: 1;
		border-color: rgba(255, 255, 255, 0.3);
	}
</style>
