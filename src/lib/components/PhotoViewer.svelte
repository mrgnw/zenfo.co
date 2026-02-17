<script lang="ts">
	import type { Photo } from '$lib/types.js';
	import DepthPhoto from './DepthPhoto.svelte';
	import DepthSlice from './DepthSlice.svelte';

	let {
		photos,
		currentIndex = $bindable(0),
		onclose,
	}: {
		photos: Photo[];
		currentIndex: number;
		onclose?: () => void;
	} = $props();

	let mode = $state<'parallax' | 'focus'>('parallax');
	let photo = $derived(photos[currentIndex]);

	function prev() {
		if (currentIndex > 0) currentIndex--;
	}

	function next() {
		if (currentIndex < photos.length - 1) currentIndex++;
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') prev();
		else if (e.key === 'ArrowRight') next();
		else if (e.key === 'Escape') onclose?.();
	}

	function stop(fn: (e: MouseEvent) => void) {
		return (e: MouseEvent) => {
			e.stopPropagation();
			fn(e);
		};
	}
</script>

<svelte:window {onkeydown} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay" onclick={onclose}>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="viewer" onclick={stop(() => {})}>
		{#key `${currentIndex}-${mode}`}
			<div class="photo-wrap">
				{#if mode === 'parallax'}
					<DepthPhoto
						src={photo.src}
						depthSrc={photo.depthSrc}
						alt={photo.title}
						intensity={0.02}
					/>
				{:else}
					<DepthSlice
						src={photo.src}
						depthSrc={photo.depthSrc}
						alt={photo.title}
					/>
				{/if}
			</div>
		{/key}
		<div class="caption">
			<h2>{photo.title}</h2>
			{#if photo.caption}
				<p>{photo.caption}</p>
			{/if}
			<div class="controls">
				<span class="counter">{currentIndex + 1} / {photos.length}</span>
				<div class="mode-toggle">
					<button
						class="mode-btn"
						class:active={mode === 'parallax'}
						onclick={stop(() => { mode = 'parallax'; })}
					>
						Parallax
					</button>
					<button
						class="mode-btn"
						class:active={mode === 'focus'}
						onclick={stop(() => { mode = 'focus'; })}
					>
						Focus
					</button>
				</div>
			</div>
		</div>
	</div>

	<button class="nav nav-prev" onclick={stop(prev)} disabled={currentIndex === 0}>
		&#8592;
	</button>
	<button class="nav nav-next" onclick={stop(next)} disabled={currentIndex === photos.length - 1}>
		&#8594;
	</button>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: rgba(0, 0, 0, 0.92);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.viewer {
		max-width: 90vw;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.photo-wrap {
		width: 90vw;
		height: 80vh;
		overflow: hidden;
	}
	.caption {
		text-align: center;
		padding: 0.5rem;
	}
	.caption h2 {
		font-size: 1.1rem;
		font-weight: 400;
		margin: 0;
		color: var(--color-text);
	}
	.caption p {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		margin: 0.25rem 0 0;
	}
	.controls {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-top: 0.5rem;
	}
	.counter {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}
	.mode-toggle {
		display: flex;
		gap: 0.25rem;
		background: rgba(255, 255, 255, 0.06);
		border-radius: 0.375rem;
		padding: 0.15rem;
	}
	.mode-btn {
		all: unset;
		font-size: 0.7rem;
		padding: 0.25rem 0.6rem;
		border-radius: 0.25rem;
		color: var(--color-text-muted);
		cursor: pointer;
		transition: all 0.15s;
	}
	.mode-btn:hover {
		color: var(--color-text);
	}
	.mode-btn.active {
		background: rgba(255, 255, 255, 0.12);
		color: var(--color-text);
	}
	.nav {
		all: unset;
		position: fixed;
		top: 50%;
		transform: translateY(-50%);
		font-size: 2rem;
		color: var(--color-text-muted);
		padding: 1rem;
		cursor: pointer;
		transition: color 0.15s;
		user-select: none;
	}
	.nav:hover:not(:disabled) {
		color: var(--color-text);
	}
	.nav:disabled {
		opacity: 0.2;
		cursor: default;
	}
	.nav-prev {
		left: 1rem;
	}
	.nav-next {
		right: 1rem;
	}
</style>
