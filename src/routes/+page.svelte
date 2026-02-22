<script lang="ts">
	import HeroShowcase from '$lib/components/HeroShowcase.svelte';
	import LightTable from '$lib/components/LightTable.svelte';
	import type { HeroPhoto } from '$lib/types';

	// All hero photos with depth maps — cover-fit handles any aspect ratio
	const heroPhotos: HeroPhoto[] = [
		{ src: '/samples/describe/20230708-A7_00042-Edit.jpg', depthSrc: '/samples/describe/20230708-A7_00042-Edit-l-depth.avif', title: 'Lobo de espejo', caption: 'A soaking wet wolf trots along a misty beach', saturation: 0, w: 2048, h: 1152 },
		{ src: '/samples/describe/20240508-IMG_1615-Pano-2.jpg', depthSrc: '/samples/describe/20240508-IMG_1615-Pano-2-l-depth.avif', title: 'Golden Hour Through the Trees', caption: 'Warm evening light floods through an arched window of a European palace', w: 2048, h: 1280 },
		{ src: '/samples/describe/20240625-A7_00222-HDR.jpg', depthSrc: '/samples/describe/20240625-A7_00222-HDR-l-depth.avif', title: 'Mossy Sentinel', caption: 'A massive moss-covered log in a temperate rainforest', w: 1365, h: 2048 },
		{ src: '/samples/describe/20230708-A7_00067.jpg', depthSrc: '/samples/describe/20230708-A7_00067-l-depth.avif', title: 'Lake in the Clouds', caption: 'Snow-capped peaks wrapped in low cloud above a still Patagonian lake', w: 1152, h: 2048 },
		{ src: '/samples/describe/20240627-A7_00077-HDR.jpg', depthSrc: '/samples/describe/20240627-A7_00077-HDR-l-depth.avif', title: 'Mountain Railway', caption: 'A narrow-gauge train curves through a dramatic alpine pass', w: 1350, h: 2048 },
		{ src: '/samples/describe/20231008-A7_00156-HDR.jpg', depthSrc: '/samples/describe/20231008-A7_00156-HDR-l-depth.avif', title: 'City Bicycle', caption: 'A classic dark-blue city bike on a tree-lined sidewalk', w: 1365, h: 2048 },
		{ src: '/samples/describe/20231021-IMG_4709 (1).jpg', depthSrc: '/samples/describe/20231021-IMG_4709 (1)-l-depth.avif', title: 'Coastal Palm', caption: 'A spiky fan palm above golden limestone cliffs and turquoise sea', w: 1536, h: 2048 },
	];

	// Light table photos with native dimensions
	const tablePhotos = [
		{ src: '/samples/describe/20230708-A7_00042-Edit.jpg', title: 'Lobo de espejo', caption: 'A soaking wet wolf trots along a misty beach', w: 2048, h: 1152 },
		{ src: '/samples/describe/20240625-A7_00222-HDR.jpg', title: 'Mossy Sentinel', caption: 'A massive moss-covered log in a temperate rainforest', w: 1365, h: 2048 },
		{ src: '/samples/describe/20230708-A7_00067.jpg', title: 'Lake in the Clouds', caption: 'Snow-capped peaks wrapped in low cloud above a still Patagonian lake', w: 1152, h: 2048 },
		{ src: '/samples/describe/20240627-A7_00077-HDR.jpg', title: 'Mountain Railway', caption: 'A narrow-gauge train curves through a dramatic alpine pass', w: 1350, h: 2048 },
		{ src: '/samples/describe/20231008-A7_00156-HDR.jpg', title: 'City Bicycle', caption: 'A classic dark-blue city bike on a tree-lined sidewalk', w: 1365, h: 2048 },
		{ src: '/samples/describe/20231021-IMG_4709 (1).jpg', title: 'Coastal Palm', caption: 'A spiky fan palm above golden limestone cliffs and turquoise sea', w: 1536, h: 2048 },
		{ src: '/samples/describe/20240508-IMG_1615-Pano-2.jpg', title: 'Golden Hour Through the Trees', caption: 'Warm evening light floods through an arched window of a European palace', w: 2048, h: 1280 },
		{ src: '/samples/describe/20230706-DJI_0145-HDR-Pano-Edit.jpg', title: 'Patagonian Dusk', caption: 'An aerial panorama over a glacial lake surrounded by snow-dusted Andean peaks', w: 2048, h: 1267 },
		{ src: '/samples/describe/20240628-A7_00040.jpg', title: 'Glacial Inlet', caption: 'A vast mirror-calm Alaskan inlet reflects snow-capped mountains', w: 2048, h: 1365 },
		{ src: '/samples/describe/20250323-IMG_4925.jpg', title: 'Barcelona Tiles', caption: 'Wet hexagonal pavement tiles embossed with sea creatures glisten after rain', w: 2048, h: 1280 },
		{ src: '/samples/describe/20230713-DJI_0412.jpg', title: 'Rock and Foam', caption: 'Jagged coastal boulders with turquoise water and white foam', w: 2048, h: 1152 },
		{ src: '/samples/describe/20240306-IMG_8457-Pano.jpg', title: 'Gothic Quarter Alley', caption: 'A narrow Barcelona lane flanked by ornate stone facades', w: 824, h: 2048 },
	];

	let currentHeroIndex = $state(0);
</script>

<svelte:head>
	<title>morgan.photos</title>
</svelte:head>

<div class="site-name">morgan.photos</div>

<HeroShowcase
	photos={heroPhotos}
	onindexchange={(i) => { currentHeroIndex = i; }}
/>

<LightTable photos={tablePhotos} />

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
