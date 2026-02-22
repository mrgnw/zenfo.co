<script lang="ts">
	import { T } from '@threlte/core';
	import { ShaderMaterial, Vector2 } from 'three';
	import type { Texture } from 'three';

	interface Props {
		imageA: Texture | null;
		depthA: Texture | null;
		imageB: Texture | null;
		depthB: Texture | null;
		progress: number;
		saturationA?: number;
		saturationB?: number;
		pointer?: { x: number; y: number };
		intensity?: number;
		imageSizeA?: { x: number; y: number };
		imageSizeB?: { x: number; y: number };
		resolution?: { x: number; y: number };
	}

	let {
		imageA,
		depthA,
		imageB,
		depthB,
		progress,
		saturationA = 1,
		saturationB = 1,
		pointer = { x: 0.5, y: 0.5 },
		intensity = 0.02,
		imageSizeA = { x: 1920, y: 1080 },
		imageSizeB = { x: 1920, y: 1080 },
		resolution = { x: 1920, y: 1080 },
	}: Props = $props();

	const vertexShader = /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`;

	const fragmentShader = /* glsl */ `
		uniform sampler2D u_image_a;
		uniform sampler2D u_depth_a;
		uniform sampler2D u_image_b;
		uniform sampler2D u_depth_b;
		uniform float u_progress;
		uniform float u_saturation_a;
		uniform float u_saturation_b;
		uniform vec2 u_pointer;
		uniform float u_intensity;
		uniform vec2 u_resolution;
		uniform vec2 u_image_size_a;
		uniform vec2 u_image_size_b;

		varying vec2 vUv;

	// Hybrid cover/contain: uses cover when orientations match, blends toward
	// contain when they differ significantly to avoid extreme cropping
	vec2 coverUv(vec2 uv, vec2 imgSize, vec2 quadSize) {
		if (imgSize.x <= 0.0 || imgSize.y <= 0.0 || quadSize.x <= 0.0 || quadSize.y <= 0.0) return uv;
		float imgAspect = imgSize.x / imgSize.y;
		float quadAspect = quadSize.x / quadSize.y;
		
		// Cover scale (fill viewport, crop excess)
		vec2 coverScale = vec2(1.0);
		if (imgAspect > quadAspect) {
			coverScale.x = quadAspect / imgAspect;
		} else {
			coverScale.y = imgAspect / quadAspect;
		}
		
		// Contain scale (show full image, add bars)
		vec2 containScale = vec2(1.0);
		if (imgAspect > quadAspect) {
			containScale.y = imgAspect / quadAspect;
		} else {
			containScale.x = quadAspect / imgAspect;
		}
		
		// Mismatch factor: 0 when aspects match, 1 when very different
		float ratio = imgAspect / quadAspect;
		float mismatch = 1.0 - min(ratio, 1.0 / ratio);
		mismatch = smoothstep(0.0, 0.6, mismatch);
		
		vec2 scale = mix(coverScale, containScale, mismatch);
		return (uv - 0.5) * scale + 0.5;
	}

		// Mirror wrap to avoid edge tearing from parallax
		vec2 mirrored(vec2 uv) {
			vec2 m = mod(uv, 2.0);
			return mix(m, 2.0 - m, step(1.0, m));
		}

		// Saturation adjustment via luma
		vec3 adjustSat(vec3 rgb, float sat) {
			float luma = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
			return mix(vec3(luma), rgb, sat);
		}

		// 9-tap box blur approximation
		vec4 blurSample(sampler2D tex, vec2 uv, float amount) {
			vec4 sum = vec4(0.0);
			float total = 0.0;
			vec2 px = amount / u_resolution;
			for (int x = -1; x <= 1; x++) {
				for (int y = -1; y <= 1; y++) {
					float w = 1.0 - length(vec2(x, y)) * 0.25;
					sum += texture2D(tex, mirrored(uv + vec2(float(x), float(y)) * px)) * w;
					total += w;
				}
			}
			return sum / total;
		}

		void main() {
			// Cover-fit UV mapping per image
			vec2 uvA = coverUv(vUv, u_image_size_a, u_resolution);
			vec2 uvB = coverUv(vUv, u_image_size_b, u_resolution);

			// Depth-driven parallax (pointer only, not transition)
			vec2 pointerOffset = (u_pointer - 0.5) * u_intensity;
			float dA = texture2D(u_depth_a, mirrored(uvA)).r;
			float dB = texture2D(u_depth_b, mirrored(uvB)).r;

			uvA = mirrored(uvA - pointerOffset * dA);
			uvB = mirrored(uvB - pointerOffset * dB);

			// Sample both images
			vec4 colA = texture2D(u_image_a, uvA);
			vec4 colB = texture2D(u_image_b, uvB);

			// Saturation
			colA.rgb = adjustSat(colA.rgb, u_saturation_a);
			colB.rgb = adjustSat(colB.rgb, u_saturation_b);

			// Simple crossfade
			gl_FragColor = mix(colA, colB, u_progress);
		}
	`;

	const material = new ShaderMaterial({
		vertexShader,
		fragmentShader,
		uniforms: {
			u_image_a: { value: null },
			u_depth_a: { value: null },
			u_image_b: { value: null },
			u_depth_b: { value: null },
			u_progress: { value: 0 },
			u_saturation_a: { value: 1 },
			u_saturation_b: { value: 1 },
			u_pointer: { value: new Vector2(0.5, 0.5) },
			u_intensity: { value: 0.02 },
			u_resolution: { value: new Vector2(1920, 1080) },
			u_image_size_a: { value: new Vector2(1920, 1080) },
			u_image_size_b: { value: new Vector2(1920, 1080) },
		},
	});

	$effect(() => {
		material.uniforms.u_image_a.value = imageA;
		material.uniforms.u_depth_a.value = depthA;
		material.uniforms.u_image_b.value = imageB;
		material.uniforms.u_depth_b.value = depthB;
		material.uniforms.u_progress.value = progress;
		material.uniforms.u_saturation_a.value = saturationA;
		material.uniforms.u_saturation_b.value = saturationB;
		material.uniforms.u_pointer.value.set(pointer.x, pointer.y);
		material.uniforms.u_intensity.value = intensity;
		material.uniforms.u_image_size_a.value.set(imageSizeA.x, imageSizeA.y);
		material.uniforms.u_image_size_b.value.set(imageSizeB.x, imageSizeB.y);
		material.uniforms.u_resolution.value.set(resolution.x, resolution.y);
	});
</script>

<T is={material} />
