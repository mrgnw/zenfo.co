export const vertexShader = `
attribute vec2 a_position;
varying vec2 vUv;

void main() {
	vUv = vec2(a_position.x * 0.5 + 0.5, 0.5 - a_position.y * 0.5);
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
uniform vec2 u_resolution;
uniform vec2 u_imageRes;

vec2 mirrored(vec2 v) {
	vec2 m = mod(v, 2.0);
	return mix(m, 2.0 - m, step(1.0, m));
}

void main() {
	float canvasAspect = u_resolution.x / u_resolution.y;
	float imageAspect = u_imageRes.x / u_imageRes.y;

	vec2 uv = vUv;
	if (imageAspect > canvasAspect) {
		float scale = canvasAspect / imageAspect;
		uv.y = (uv.y - 0.5) / scale + 0.5;
	} else {
		float scale = imageAspect / canvasAspect;
		uv.x = (uv.x - 0.5) / scale + 0.5;
	}

	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
		gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
		return;
	}

	float depth = texture2D(u_depth, uv).r;
	vec2 offset = u_pointer * depth * u_intensity;
	vec2 displaced = mirrored(uv + offset);
	vec4 color = texture2D(u_image, displaced);

	vec2 vc = uv * 2.0 - 1.0;
	float vignette = 1.0 - dot(vc, vc) * (0.15 + 0.2 * (1.0 - depth));
	color.rgb *= clamp(vignette, 0.0, 1.0);

	gl_FragColor = color;
}
`;
