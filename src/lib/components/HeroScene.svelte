<script lang="ts">
	import { T, useThrelte } from '@threlte/core';
	import { LinearFilter, OrthographicCamera, SRGBColorSpace, TextureLoader } from 'three';
	import type { Texture } from 'three';
	import DepthTransitionMaterial from './DepthTransitionMaterial.svelte';
	import type { HeroPhoto } from '$lib/types';

	interface Props {
		photoA: HeroPhoto;
		photoB: HeroPhoto;
		progress: number;
		pointer: { x: number; y: number };
	}

	let { photoA, photoB, progress, pointer }: Props = $props();

	const { camera, invalidate, size } = useThrelte();

	const cam = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
	cam.position.set(0, 0, 1);
	$effect(() => { camera.set(cam); });

	const loader = new TextureLoader();
	const resolved = new Map<string, Texture>();
	const pending = new Map<string, Promise<Texture>>();

	function loadTex(url: string, color = false): Texture | null {
		if (resolved.has(url)) return resolved.get(url)!;
		if (!pending.has(url)) {
			const p = loader.loadAsync(url).then(t => {
				if (color) t.colorSpace = SRGBColorSpace;
				t.minFilter = LinearFilter;
				resolved.set(url, t);
				return t;
			});
			pending.set(url, p);
		}
		return null;
	}

	// Kick off loads and try to resolve synchronously from cache
	function getTextures(a: HeroPhoto, b: HeroPhoto): [Texture, Texture, Texture, Texture] | null {
		const t0 = loadTex(a.src, true);
		const t1 = loadTex(a.depthSrc);
		const t2 = loadTex(b.src, true);
		const t3 = loadTex(b.depthSrc);
		if (t0 && t1 && t2 && t3) return [t0, t1, t2, t3];
		return null;
	}

	let textures = $state<[Texture, Texture, Texture, Texture] | null>(null);
	let imageSizeA = $derived({ x: photoA.w, y: photoA.h });
	let imageSizeB = $derived({ x: photoB.w, y: photoB.h });

	$effect(() => {
		const a = photoA, b = photoB;
		// Try synchronous resolve first (cache hit)
		const sync = getTextures(a, b);
		if (sync) {
			textures = sync;
			invalidate();
			return;
		}
		// Otherwise wait for all to load
		const urls = [a.src, a.depthSrc, b.src, b.depthSrc];
		Promise.all(urls.map(u => pending.get(u)!)).then(() => {
			if (photoA !== a || photoB !== b) return;
			textures = getTextures(a, b);
			invalidate();
		});
	});

	$effect(() => {
		progress; pointer.x; pointer.y; size.current.width; size.current.height;
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
			saturationA={photoA.saturation ?? 1}
			saturationB={photoB.saturation ?? 1}
			{pointer}
			{imageSizeA}
			{imageSizeB}
			resolution={{ x: size.current.width, y: size.current.height }}
		/>
	{/if}
</T.Mesh>
