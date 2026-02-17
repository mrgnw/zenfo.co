<script lang="ts">
	import { onMount } from 'svelte';

	let {
		src,
		depthSrc,
		alt,
	}: {
		src: string;
		depthSrc: string;
		alt: string;
	} = $props();

	let containerEl: HTMLDivElement;
	let canvasEl: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let imageData: ImageData | null = null;
	let depthData: Uint8ClampedArray | null = null;
	let width = 0;
	let height = 0;
	let currentDepth = $state(0.5);
	let isHovering = $state(false);

	async function loadImages() {
		const [img, depthImg] = await Promise.all([loadImage(src), loadImage(depthSrc)]);

		width = img.width;
		height = img.height;
		canvasEl.width = width;
		canvasEl.height = height;

		ctx = canvasEl.getContext('2d', { willReadFrequently: true });
		if (!ctx) return;

		ctx.drawImage(img, 0, 0);
		imageData = ctx.getImageData(0, 0, width, height);

		const tempCanvas = document.createElement('canvas');
		tempCanvas.width = width;
		tempCanvas.height = height;
		const tempCtx = tempCanvas.getContext('2d');
		if (!tempCtx) return;

		tempCtx.drawImage(depthImg, 0, 0, width, height);
		const depthImageData = tempCtx.getImageData(0, 0, width, height);
		depthData = depthImageData.data;

		render();
	}

	function loadImage(url: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = url;
		});
	}

	function render() {
		if (!ctx || !imageData || !depthData) return;

		const output = ctx.createImageData(width, height);
		const targetDepth = currentDepth * 255;
		const range = 30;

		for (let i = 0; i < imageData.data.length; i += 4) {
			const depth = depthData[i];
			const distance = Math.abs(depth - targetDepth);

			let factor: number;
			if (isHovering) {
				if (distance < range) {
					factor = 1.0 + (1 - distance / range) * 0.3;
				} else {
					const dimAmount = Math.min((distance - range) / 100, 0.7);
					factor = 1.0 - dimAmount;
				}
			} else {
				factor = 1.0;
			}

			output.data[i] = Math.min(255, imageData.data[i] * factor);
			output.data[i + 1] = Math.min(255, imageData.data[i + 1] * factor);
			output.data[i + 2] = Math.min(255, imageData.data[i + 2] * factor);
			output.data[i + 3] = imageData.data[i + 3];
		}

		ctx.putImageData(output, 0, 0);
	}

	function handleMouseMove(e: MouseEvent) {
		if (!containerEl || !depthData || !width || !height) return;

		const rect = canvasEl.getBoundingClientRect();
		const x = Math.floor(((e.clientX - rect.left) / rect.width) * width);
		const y = Math.floor(((e.clientY - rect.top) / rect.height) * height);

		if (x >= 0 && x < width && y >= 0 && y < height) {
			const idx = (y * width + x) * 4;
			currentDepth = depthData[idx] / 255;
			isHovering = true;
			render();
		}
	}

	function handleMouseLeave() {
		isHovering = false;
		render();
	}

	onMount(() => {
		loadImages();
	});
</script>

<div
	bind:this={containerEl}
	class="depth-slice"
	onmousemove={handleMouseMove}
	onmouseleave={handleMouseLeave}
	role="img"
	aria-label={alt}
>
	<canvas bind:this={canvasEl}></canvas>

	{#if isHovering}
		<div class="indicator">
			Depth: {Math.round(currentDepth * 100)}%
		</div>
	{/if}
</div>

<style>
	.depth-slice {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		background: #000;
		cursor: default;
	}
	canvas {
		max-width: 100%;
		max-height: 100%;
		display: block;
		object-fit: contain;
	}
	.indicator {
		position: absolute;
		bottom: 1rem;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.7);
		color: #fff;
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		font-size: 0.75rem;
		pointer-events: none;
		backdrop-filter: blur(4px);
	}
</style>
