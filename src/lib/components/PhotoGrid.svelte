<script lang="ts">
	import type { Photo } from '$lib/types.js';
	import DepthPhoto from './DepthPhoto.svelte';

	let {
		photos,
		onselect,
	}: {
		photos: Photo[];
		onselect?: (index: number) => void;
	} = $props();
</script>

<div class="grid">
	{#each photos as photo, i}
		<button class="grid-item" onclick={() => onselect?.(i)}>
			<DepthPhoto
				src={photo.src}
				depthSrc={photo.depthSrc}
				alt={photo.title}
				aspect={photo.aspect}
				intensity={0.01}
			/>
			<span class="title">{photo.title}</span>
		</button>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;
		padding: 2rem;
		max-width: 1600px;
		margin: 0 auto;
	}
	.grid-item {
		all: unset;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		transition: transform 0.2s ease;
	}
	.grid-item:hover {
		transform: scale(1.01);
	}
	.title {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		padding: 0 0.25rem;
	}
</style>
