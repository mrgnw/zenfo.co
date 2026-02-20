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

		varying vec2 vUv;

		// Cover-fit UV correction — maps texture to fill the quad while preserving aspect ratio
		vec2 coverUv(vec2 uv, vec2 imgSize, vec2 quadSize) {
			vec2 s = quadSize / imgSize;
			float scale = max(s.x, s.y);
			vec2 offset = (quadSize - imgSize * scale) / 2.0 / quadSize;
			return uv * (quadSize / (imgSize * scale)) + offset * 0.0
				+ (uv - 0.5) * (1.0 - quadSize / (imgSize * scale)) * 0.0;
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
			vec2 uv = vUv;

			// Pointer-driven parallax on whichever image is dominant
			vec2 pointerOffset = (u_pointer - 0.5) * u_intensity;

			// Sample depth from outgoing image
			float dA = texture2D(u_depth_a, mirrored(uv)).r;
			float dB = texture2D(u_depth_b, mirrored(uv)).r;

			// Per-pixel progress: foreground (high depth) peels first
			float spread = 0.35;
			float pixelProgress = smoothstep(dA - spread, dA + spread, u_progress);

			// Parallax displacement — outgoing fades, incoming takes over
			vec2 uvA = mirrored(uv - pointerOffset * dA * (1.0 - pixelProgress));
			vec2 uvB = mirrored(uv - pointerOffset * dB * pixelProgress);

			// Sample with blur proportional to pixel progress (outgoing blurs out)
			float blurAmount = pixelProgress * (1.0 - pixelProgress) * 8.0;
			vec4 colA = blurSample(u_image_a, uvA, blurAmount * 2.0 + 0.001);
			vec4 colB = texture2D(u_image_b, uvB);

			// Saturation adjustment (for B&W ↔ color transitions)
			float satA = mix(u_saturation_a, u_saturation_b, pixelProgress);
			colA.rgb = adjustSat(colA.rgb, satA);
			colB.rgb = adjustSat(colB.rgb, u_saturation_b);

			// Depth-modulated vignette on outgoing image
			float vigA = smoothstep(0.0, 0.4, dA) * (1.0 - pixelProgress);
			colA.rgb *= (1.0 - vigA * 0.3);

			gl_FragColor = mix(colA, colB, pixelProgress);
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
	});
</script>

<T is={material} />
