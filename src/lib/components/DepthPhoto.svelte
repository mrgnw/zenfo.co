<script lang="ts">
	import { ParallaxRenderer } from '$lib/gl/renderer.js';
	import { onMount } from 'svelte';

	let {
		src,
		depthSrc,
		alt,
		intensity = 0.02,
	}: {
		src: string;
		depthSrc: string;
		alt: string;
		intensity?: number;
	} = $props();

	let canvas: HTMLCanvasElement;
	let wrapper: HTMLDivElement;
	let renderer: ParallaxRenderer | null = null;
	let webglSupported = $state(true);

	let isMobile = $state(false);
	let motionActive = $state(false);
	let promptVisible = $state(false);
	let promptText = $state('tilt your phone to look around');
	let promptFading = $state(false);

	function hasMotionSupport(): boolean {
		return 'ontouchstart' in window && !!window.DeviceOrientationEvent;
	}

	function needsPermission(): boolean {
		return typeof (DeviceOrientationEvent as any).requestPermission === 'function';
	}

	function onOrientation(e: DeviceOrientationEvent) {
		if (!renderer || !motionActive) return;
		const gamma = e.gamma ?? 0;
		const beta = e.beta ?? 0;
		const x = Math.max(-1, Math.min(1, gamma / 30));
		const y = Math.max(-1, Math.min(1, (beta - 60) / 25));
		renderer.setPointer(x, y);
	}

	function dismissPrompt(text?: string) {
		if (text) promptText = text;
		setTimeout(() => {
			promptFading = true;
			setTimeout(() => {
				promptVisible = false;
				promptFading = false;
			}, 600);
		}, text ? 800 : 0);
	}

	function activateMotion() {
		motionActive = true;
		window.addEventListener('deviceorientation', onOrientation);
		dismissPrompt('nice.');
	}

	async function requestMotion() {
		if (motionActive) return;
		if (needsPermission()) {
			try {
				const result = await (DeviceOrientationEvent as any).requestPermission();
				if (result === 'granted') {
					activateMotion();
				} else {
					dismissPrompt();
				}
			} catch {
				dismissPrompt();
			}
		} else {
			activateMotion();
		}
	}

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

		isMobile = hasMotionSupport();
		if (isMobile) {
			setTimeout(() => {
				if (!motionActive) promptVisible = true;
			}, 800);

			if (!needsPermission()) {
				setTimeout(() => {
					if (!motionActive) activateMotion();
				}, 1200);
			}
		}

		return () => {
			observer.disconnect();
			window.removeEventListener('deviceorientation', onOrientation);
			renderer?.destroy();
		};
	});

	function onPointerMove(e: MouseEvent | TouchEvent) {
		if (!renderer || motionActive) return;
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
		if (motionActive) return;
		renderer?.setPointer(0, 0);
	}

	function onTap() {
		if (isMobile && !motionActive) requestMotion();
	}
</script>

{#if webglSupported}
	<div class="depth-photo-wrap" bind:this={wrapper}>
		<canvas
			bind:this={canvas}
			onmousemove={onPointerMove}
			ontouchmove={onPointerMove}
			onmouseleave={onPointerLeave}
			onclick={onTap}
		></canvas>

		{#if promptVisible}
			<button
				class="motion-prompt"
				class:fading={promptFading}
				class:rocking={!motionActive}
				onclick={onTap}
			>
				{promptText}
			</button>
		{/if}
	</div>
{:else}
	<img {src} {alt} />
{/if}

<style>
	.depth-photo-wrap {
		position: relative;
		width: 100%;
		height: 100%;
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
		cursor: default;
	}
	img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
	.motion-prompt {
		all: unset;
		position: absolute;
		bottom: 1.5rem;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		color: var(--color-text-muted);
		font-size: 0.7rem;
		letter-spacing: 0.08em;
		padding: 0.4rem 0.9rem;
		border-radius: 999px;
		cursor: pointer;
		white-space: nowrap;
		opacity: 1;
		animation: prompt-in 0.6s ease both;
		transition: opacity 0.6s ease, color 0.3s ease;
	}
	.motion-prompt:hover {
		color: var(--color-text);
	}
	.motion-prompt.fading {
		opacity: 0;
	}
	.motion-prompt.rocking {
		animation: prompt-in 0.6s ease both, rock 2.5s ease-in-out 0.6s infinite;
	}
	@keyframes prompt-in {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}
	@keyframes rock {
		0%, 100% { transform: translateX(-50%) translateY(0) rotate(0deg); }
		25% { transform: translateX(-50%) translateY(0) rotate(-2deg); }
		75% { transform: translateX(-50%) translateY(0) rotate(2deg); }
	}
</style>
