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
	gl_FragColor = texture2D(u_image, uv);
}
`;
