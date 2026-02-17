<script lang="ts">
	import type { Photo } from '$lib/types.js';
	import PhotoGrid from '$lib/components/PhotoGrid.svelte';
	import PhotoViewer from '$lib/components/PhotoViewer.svelte';
	import { onMount } from 'svelte';

	let photos: Photo[] = $state([]);
	let viewerOpen = $state(false);
	let viewerIndex = $state(0);

	function generateImage(width: number, height: number, hue: number, pattern: string): string {
		const c = document.createElement('canvas');
		c.width = width;
		c.height = height;
		const ctx = c.getContext('2d')!;

		const bg = ctx.createLinearGradient(0, 0, width, height);
		bg.addColorStop(0, `hsl(${hue}, 40%, 15%)`);
		bg.addColorStop(1, `hsl(${hue + 60}, 40%, 25%)`);
		ctx.fillStyle = bg;
		ctx.fillRect(0, 0, width, height);

		if (pattern === 'circles') {
			for (let i = 0; i < 5; i++) {
				ctx.beginPath();
				ctx.arc(
					width * (0.2 + Math.random() * 0.6),
					height * (0.2 + Math.random() * 0.6),
					30 + Math.random() * 80,
					0, Math.PI * 2
				);
				ctx.fillStyle = `hsla(${hue + i * 30}, 50%, 50%, 0.3)`;
				ctx.fill();
			}
		} else if (pattern === 'lines') {
			for (let i = 0; i < 8; i++) {
				ctx.beginPath();
				ctx.moveTo(Math.random() * width, Math.random() * height);
				ctx.lineTo(Math.random() * width, Math.random() * height);
				ctx.strokeStyle = `hsla(${hue + i * 20}, 60%, 60%, 0.4)`;
				ctx.lineWidth = 2 + Math.random() * 4;
				ctx.stroke();
			}
		} else {
			for (let i = 0; i < 6; i++) {
				const x = Math.random() * width;
				const y = Math.random() * height;
				const s = 20 + Math.random() * 60;
				ctx.fillStyle = `hsla(${hue + i * 25}, 45%, 55%, 0.25)`;
				ctx.fillRect(x, y, s, s * (0.5 + Math.random()));
			}
		}

		return c.toDataURL('image/png');
	}

	function generateDepthMap(width: number, height: number, variant: string): string {
		const c = document.createElement('canvas');
		c.width = width;
		c.height = height;
		const ctx = c.getContext('2d')!;

		if (variant === 'radial') {
			const g = ctx.createRadialGradient(
				width / 2, height / 2, 0,
				width / 2, height / 2, Math.max(width, height) / 2
			);
			g.addColorStop(0, '#fff');
			g.addColorStop(1, '#000');
			ctx.fillStyle = g;
			ctx.fillRect(0, 0, width, height);
		} else if (variant === 'horizontal') {
			const g = ctx.createLinearGradient(0, 0, width, 0);
			g.addColorStop(0, '#000');
			g.addColorStop(0.5, '#fff');
			g.addColorStop(1, '#000');
			ctx.fillStyle = g;
			ctx.fillRect(0, 0, width, height);
		} else {
			const g = ctx.createLinearGradient(0, 0, 0, height);
			g.addColorStop(0, '#fff');
			g.addColorStop(1, '#333');
			ctx.fillStyle = g;
			ctx.fillRect(0, 0, width, height);
		}

		return c.toDataURL('image/png');
	}

	const demoData = [
		{ title: 'Twilight Coast', caption: 'Pacific shoreline at dusk', hue: 220, aspect: 1.5, pattern: 'circles', depth: 'radial' },
		{ title: 'Forest Path', caption: 'Muir Woods, California', hue: 130, aspect: 0.75, pattern: 'lines', depth: 'horizontal' },
		{ title: 'Urban Light', caption: 'Downtown reflections', hue: 35, aspect: 1.33, pattern: 'rects', depth: 'radial' },
		{ title: 'Mountain Pass', caption: 'Sierra Nevada, early morning', hue: 200, aspect: 1.5, pattern: 'circles', depth: 'vertical' },
		{ title: 'Still Water', caption: 'Alpine lake reflection', hue: 180, aspect: 1.78, pattern: 'lines', depth: 'horizontal' },
		{ title: 'Desert Bloom', caption: 'Joshua Tree in spring', hue: 15, aspect: 1.0, pattern: 'rects', depth: 'radial' },
	];

	onMount(() => {
		const samplePhoto: Photo = {
			slug: 'mountain-lake',
			title: 'Mountain Lake',
			caption: 'Alpine depth sample',
			src: '/samples/sample.jpg',
			depthSrc: '/samples/sample-depth.jpg',
			aspect: 1.5,
		};

		const procedural = demoData.map((d) => {
			const w = 640;
			const h = Math.round(w / d.aspect);
			return {
				slug: d.title.toLowerCase().replace(/\s+/g, '-'),
				title: d.title,
				caption: d.caption,
				src: generateImage(w, h, d.hue, d.pattern),
				depthSrc: generateDepthMap(w, h, d.depth),
				aspect: d.aspect,
			};
		});

		photos = [samplePhoto, ...procedural];
	});

	function openViewer(index: number) {
		viewerIndex = index;
		viewerOpen = true;
	}
</script>

<svelte:head>
	<title>morgan.photos</title>
</svelte:head>

<main>
	<header>
		<h1>morgan.photos</h1>
	</header>

	{#if photos.length > 0}
		<PhotoGrid {photos} onselect={openViewer} />
	{/if}

	{#if viewerOpen}
		<PhotoViewer
			{photos}
			bind:currentIndex={viewerIndex}
			onclose={() => viewerOpen = false}
		/>
	{/if}
</main>

<style>
	main {
		min-height: 100vh;
	}
	header {
		padding: 2rem 2rem 0;
		max-width: 1600px;
		margin: 0 auto;
	}
	h1 {
		font-size: 1.25rem;
		font-weight: 300;
		letter-spacing: 0.1em;
		color: var(--color-text-muted);
	}
</style>
