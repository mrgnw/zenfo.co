import type { Lang } from './lang';
import type { HeroPhoto } from './types';

interface PhotoEntry {
	w: number;
	h: number;
	depthSrc?: string;
	saturation?: number;
	en: { title: string; caption: string };
	es: { title: string; caption: string };
}

const dir = '/samples/describe';

const photos: Record<string, PhotoEntry> = {
	'20230708-A7_00042-Edit': {
		w: 2048,
		h: 1152,
		depthSrc: `${dir}/20230708-A7_00042-Edit-l-depth.avif`,
		saturation: 0,
		en: { title: 'Lobo de espejo', caption: 'A soaking wet wolf trots along a misty beach' },
		es: { title: 'Lobo de espejo', caption: 'Un lobo empapado trota por una playa neblinosa' }
	},
	'20240508-IMG_1615-Pano-2': {
		w: 2048,
		h: 1280,
		depthSrc: `${dir}/20240508-IMG_1615-Pano-2-l-depth.avif`,
		en: {
			title: 'Golden Hour Through the Trees',
			caption: 'Warm evening light floods through an arched window of a European palace'
		},
		es: {
			title: 'Hora dorada entre los árboles',
			caption: 'La luz cálida del atardecer entra por el ventanal de un palacio europeo'
		}
	},
	'20240625-A7_00222-HDR': {
		w: 1365,
		h: 2048,
		depthSrc: `${dir}/20240625-A7_00222-HDR-l-depth.avif`,
		en: { title: 'Mossy Sentinel', caption: 'A massive moss-covered log in a temperate rainforest' },
		es: {
			title: 'Centinela de musgo',
			caption: 'Un tronco enorme cubierto de musgo en un bosque templado lluvioso'
		}
	},
	'20230708-A7_00067': {
		w: 1152,
		h: 2048,
		depthSrc: `${dir}/20230708-A7_00067-l-depth.avif`,
		en: {
			title: 'Lake in the Clouds',
			caption: 'Snow-capped peaks wrapped in low cloud above a still Patagonian lake'
		},
		es: {
			title: 'Lago entre nubes',
			caption: 'Cumbres nevadas envueltas en nubes bajas sobre un lago patagónico en calma'
		}
	},
	'20240627-A7_00077-HDR': {
		w: 1350,
		h: 2048,
		depthSrc: `${dir}/20240627-A7_00077-HDR-l-depth.avif`,
		en: {
			title: 'Mountain Railway',
			caption: 'A narrow-gauge train curves through a dramatic alpine pass'
		},
		es: {
			title: 'Tren de montaña',
			caption: 'Un tren de vía estrecha traza una curva en un espectacular paso alpino'
		}
	},
	'20231008-A7_00156-HDR': {
		w: 1365,
		h: 2048,
		depthSrc: `${dir}/20231008-A7_00156-HDR-l-depth.avif`,
		en: { title: 'City Bicycle', caption: 'A classic dark-blue city bike on a tree-lined sidewalk' },
		es: {
			title: 'Bicicleta urbana',
			caption: 'Una bicicleta urbana azul marino en una acera arbolada'
		}
	},
	'20231021-IMG_4709 (1)': {
		w: 1536,
		h: 2048,
		depthSrc: `${dir}/20231021-IMG_4709 (1)-l-depth.avif`,
		en: {
			title: 'Coastal Palm',
			caption: 'A spiky fan palm above golden limestone cliffs and turquoise sea'
		},
		es: {
			title: 'Palmera costera',
			caption: 'Un palmito sobre acantilados de piedra caliza dorada y mar turquesa'
		}
	},
	'20230706-DJI_0145-HDR-Pano-Edit': {
		w: 2048,
		h: 1267,
		en: {
			title: 'Patagonian Dusk',
			caption: 'An aerial panorama over a glacial lake surrounded by snow-dusted Andean peaks'
		},
		es: {
			title: 'Atardecer patagónico',
			caption: 'Una panorámica aérea sobre un lago glaciar rodeado de cumbres andinas nevadas'
		}
	},
	'20240628-A7_00040': {
		w: 2048,
		h: 1365,
		en: {
			title: 'Glacial Inlet',
			caption: 'A vast mirror-calm Alaskan inlet reflects snow-capped mountains'
		},
		es: {
			title: 'Fiordo glaciar',
			caption: 'Un vasto fiordo de Alaska, liso como un espejo, refleja montañas nevadas'
		}
	},
	'20250323-IMG_4925': {
		w: 2048,
		h: 1280,
		en: {
			title: 'Barcelona Tiles',
			caption: 'Wet hexagonal pavement tiles embossed with sea creatures glisten after rain'
		},
		es: {
			title: 'Panots de Barcelona',
			caption: 'Baldosas hexagonales con motivos marinos brillan mojadas tras la lluvia'
		}
	},
	'20230713-DJI_0412': {
		w: 2048,
		h: 1152,
		en: {
			title: 'Rock and Foam',
			caption: 'Jagged coastal boulders with turquoise water and white foam'
		},
		es: {
			title: 'Roca y espuma',
			caption: 'Rocas escarpadas en la costa entre agua turquesa y espuma blanca'
		}
	},
	'20240306-IMG_8457-Pano': {
		w: 824,
		h: 2048,
		en: {
			title: 'Gothic Quarter Alley',
			caption: 'A narrow Barcelona lane flanked by ornate stone facades'
		},
		es: {
			title: 'Callejón del Gótico',
			caption: 'Una calle estrecha de Barcelona flanqueada por fachadas de piedra labrada'
		}
	}
};

const heroOrder = [
	'20230708-A7_00042-Edit',
	'20240508-IMG_1615-Pano-2',
	'20240625-A7_00222-HDR',
	'20230708-A7_00067',
	'20240627-A7_00077-HDR',
	'20231008-A7_00156-HDR',
	'20231021-IMG_4709 (1)'
];

const tableOrder = [
	'20230708-A7_00042-Edit',
	'20240625-A7_00222-HDR',
	'20230708-A7_00067',
	'20240627-A7_00077-HDR',
	'20231008-A7_00156-HDR',
	'20231021-IMG_4709 (1)',
	'20240508-IMG_1615-Pano-2',
	'20230706-DJI_0145-HDR-Pano-Edit',
	'20240628-A7_00040',
	'20250323-IMG_4925',
	'20230713-DJI_0412',
	'20240306-IMG_8457-Pano'
];

function localize(key: string, lang: Lang) {
	const { w, h, depthSrc, saturation } = photos[key];
	const { title, caption } = photos[key][lang];
	return { src: `${dir}/${key}.jpg`, depthSrc, saturation, w, h, title, caption };
}

export const heroPhotos = (lang: Lang): HeroPhoto[] =>
	heroOrder.map((key) => localize(key, lang) as HeroPhoto);

export const tablePhotos = (lang: Lang) => tableOrder.map((key) => localize(key, lang));
