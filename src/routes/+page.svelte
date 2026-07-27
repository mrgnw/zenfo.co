<script lang="ts">
	import HeroShowcase from '$lib/components/HeroShowcase.svelte';
	import LightTable from '$lib/components/LightTable.svelte';
	import { heroPhotos, tablePhotos } from '$lib/photos';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let currentHeroIndex = $state(0);
</script>

<svelte:head>
	<title>morgan.photos</title>
</svelte:head>

<div class="site-name">morgan.photos</div>

<HeroShowcase
	photos={heroPhotos(data.lang)}
	onindexchange={(i) => { currentHeroIndex = i; }}
/>

<LightTable photos={tablePhotos(data.lang)} />

<style>
	.site-name {
		position: fixed;
		top: 1.5rem;
		left: 1.5rem;
		z-index: 50;
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.8rem;
		font-weight: 300;
		letter-spacing: 0.12em;
		text-transform: lowercase;
		pointer-events: none;
		mix-blend-mode: overlay;
	}
</style>
