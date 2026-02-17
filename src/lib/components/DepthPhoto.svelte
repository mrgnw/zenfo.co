<script lang="ts">
	import { ParallaxRenderer } from '$lib/gl/renderer.js';
	import { onMount } from 'svelte';

	let {
		src,
		depthSrc,
		alt,
		aspect = 1.5,
		intensity = 0.02,
		fill = false,
	}: {
		src: string;
		depthSrc: string;
		alt: string;
		aspect?: number;
		intensity?: number;
		fill?: boolean;
	} = $props();

	let canvas: HTMLCanvasElement;
	let renderer: ParallaxRenderer | null = null;
	let webglSupported = $state(true);

	onMount(() => {
		renderer = new ParallaxRenderer();
		renderer.intensity = intensity;

		if (!renderer.init(canvas)) {
			webglSupported = false;
			return;
		}

		renderer.loadTextures(src, depthSrc).then(() => {
			renderer?.start();
		});

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) renderer?.start();
				else renderer?.stop();
			},
			{ threshold: 0.1 }
		);
		observer.observe(canvas);

		return () => {
			observer.disconnect();
			renderer?.destroy();
		};
	});

	function onPointerMove(e: MouseEvent | TouchEvent) {
		if (!renderer) return;
		const rect = canvas.getBoundingClientRect();
		let clientX: number, clientY: number;
		if ('touches' in e) {
			clientX = e.touches[0].clientX;
			clientY = e.touches[0].clientY;
		} else {
			clientX = e.clientX;
			clientY = e.clientY;
		}
		const x = ((clientX - rect.left) / rect.width) * 2 - 1;
		const y = ((clientY - rect.top) / rect.height) * 2 - 1;
		renderer.setPointer(x, y);
	}

	function onPointerLeave() {
		renderer?.setPointer(0, 0);
	}
</script>

{#if webglSupported}
	<canvas
		bind:this={canvas}
		style={fill ? 'width: 100%; height: 100%;' : `aspect-ratio: ${aspect}; width: 100%;`}
		onmousemove={onPointerMove}
		ontouchmove={onPointerMove}
		onmouseleave={onPointerLeave}
	></canvas>
{:else}
	<img {src} {alt} style={fill ? 'width: 100%; height: 100%; object-fit: cover;' : `aspect-ratio: ${aspect}; width: 100%; object-fit: cover;`} />
{/if}

<style>
	canvas {
		display: block;
		cursor: crosshair;
	}
	img {
		display: block;
	}
</style>
