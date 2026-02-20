<script lang="ts">
	import { T, useThrelte } from '@threlte/core';
	import { LinearFilter, OrthographicCamera, SRGBColorSpace, TextureLoader } from 'three';
	import type { Texture } from 'three';
	import DepthTransitionMaterial from './DepthTransitionMaterial.svelte';

	interface Props {
		srcA: string;
		depthA: string;
		srcB: string;
		depthB: string;
		progress: number;
		saturationA?: number;
		saturationB?: number;
		pointer: { x: number; y: number };
	}

	let {
		srcA,
		depthA,
		srcB,
		depthB,
		progress,
		saturationA = 1,
		saturationB = 1,
		pointer,
	}: Props = $props();

	const { camera, invalidate } = useThrelte();

	const cam = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
	cam.position.set(0, 0, 1);
	$effect(() => { camera.set(cam); });

	const loader = new TextureLoader();
	const cache = new Map<string, Promise<Texture>>();

	function loadTex(url: string, color = false): Promise<Texture> {
		if (cache.has(url)) return cache.get(url)!;
		const p = loader.loadAsync(url).then(t => {
			if (color) t.colorSpace = SRGBColorSpace;
			t.minFilter = LinearFilter;
			return t;
		});
		cache.set(url, p);
		return p;
	}

	let textures = $state<[Texture, Texture, Texture, Texture] | null>(null);

	$effect(() => {
		const a = srcA, da = depthA, b = srcB, db = depthB;
		textures = null;
		Promise.all([loadTex(a, true), loadTex(da), loadTex(b, true), loadTex(db)])
			.then(result => {
				if (srcA === a && depthA === da && srcB === b && depthB === db) {
					textures = result as [Texture, Texture, Texture, Texture];
					invalidate();
				}
			});
	});

	// Invalidate on every animated change so on-demand rendering picks it up
	$effect(() => {
		// Track reactive dependencies
		progress; pointer.x; pointer.y;
		invalidate();
	});
</script>

<T.Mesh>
	<T.PlaneGeometry args={[2, 2]} />
	{#if textures}
		<DepthTransitionMaterial
			imageA={textures[0]}
			depthA={textures[1]}
			imageB={textures[2]}
			depthB={textures[3]}
			{progress}
			{saturationA}
			{saturationB}
			{pointer}
		/>
	{/if}
</T.Mesh>
