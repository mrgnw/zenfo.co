export const vertexShader = `
attribute vec2 a_position;
varying vec2 vUv;

void main() {
	vUv = a_position * 0.5 + 0.5;
	gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const fragmentShader = `
precision mediump float;

varying vec2 vUv;
uniform sampler2D u_image;
uniform sampler2D u_depth;
uniform vec2 u_pointer;
uniform float u_intensity;

vec2 mirrored(vec2 v) {
	vec2 m = mod(v, 2.0);
	return mix(m, 2.0 - m, step(1.0, m));
}

void main() {
	float depth = texture2D(u_depth, vUv).r;
	vec2 offset = u_pointer * depth * u_intensity;
	vec2 uv = mirrored(vUv + offset);
	vec4 color = texture2D(u_image, uv);

	// depth-based vignette: darken edges more for far pixels
	vec2 vc = vUv * 2.0 - 1.0;
	float vignette = 1.0 - dot(vc, vc) * (0.15 + 0.2 * (1.0 - depth));
	color.rgb *= clamp(vignette, 0.0, 1.0);

	gl_FragColor = color;
}
`;
