import { vertexShader, fragmentShader } from './shaders.js';

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
	const shader = gl.createShader(type);
	if (!shader) return null;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}

function createProgram(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram | null {
	const program = gl.createProgram();
	if (!program) return null;
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error(gl.getProgramInfoLog(program));
		gl.deleteProgram(program);
		return null;
	}
	return program;
}

function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = url;
	});
}

function createTexture(gl: WebGLRenderingContext, image: HTMLImageElement): WebGLTexture | null {
	const tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	return tex;
}

export class ParallaxRenderer {
	private gl: WebGLRenderingContext | null = null;
	private program: WebGLProgram | null = null;
	private imageTex: WebGLTexture | null = null;
	private depthTex: WebGLTexture | null = null;
	private raf: number = 0;
	private running = false;
	private startTime = 0;

	private pointerTarget = { x: 0, y: 0 };
	private pointerCurrent = { x: 0, y: 0 };

	private locs: Record<string, WebGLUniformLocation | null> = {};

	intensity = 0.02;

	init(canvas: HTMLCanvasElement): boolean {
		const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
		if (!gl) return false;
		this.gl = gl;

		const vs = createShader(gl, gl.VERTEX_SHADER, vertexShader);
		const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
		if (!vs || !fs) return false;

		this.program = createProgram(gl, vs, fs);
		if (!this.program) return false;

		const buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

		const aPos = gl.getAttribLocation(this.program, 'a_position');
		gl.enableVertexAttribArray(aPos);
		gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

		gl.useProgram(this.program);
		this.locs = {
			u_image: gl.getUniformLocation(this.program, 'u_image'),
			u_depth: gl.getUniformLocation(this.program, 'u_depth'),
			u_pointer: gl.getUniformLocation(this.program, 'u_pointer'),
			u_intensity: gl.getUniformLocation(this.program, 'u_intensity'),
		};

		gl.uniform1i(this.locs.u_image, 0);
		gl.uniform1i(this.locs.u_depth, 1);

		return true;
	}

	async loadTextures(imageUrl: string, depthUrl: string) {
		if (!this.gl) return;
		const [img, depth] = await Promise.all([loadImage(imageUrl), loadImage(depthUrl)]);
		this.imageTex = createTexture(this.gl, img);
		this.depthTex = createTexture(this.gl, depth);
	}

	setPointer(x: number, y: number) {
		this.pointerTarget.x = x;
		this.pointerTarget.y = y;
	}

	start() {
		if (this.running) return;
		this.running = true;
		this.startTime = performance.now() / 1000;
		this.tick();
	}

	stop() {
		this.running = false;
		if (this.raf) cancelAnimationFrame(this.raf);
	}

	destroy() {
		this.stop();
		if (this.gl) {
			if (this.imageTex) this.gl.deleteTexture(this.imageTex);
			if (this.depthTex) this.gl.deleteTexture(this.depthTex);
			if (this.program) this.gl.deleteProgram(this.program);
			this.gl.getExtension('WEBGL_lose_context')?.loseContext();
		}
		this.gl = null;
	}

	private tick = () => {
		if (!this.running || !this.gl || !this.program) return;

		const gl = this.gl;
		const canvas = gl.canvas as HTMLCanvasElement;
		const dpr = window.devicePixelRatio || 1;
		const w = canvas.clientWidth * dpr;
		const h = canvas.clientHeight * dpr;
		if (canvas.width !== w || canvas.height !== h) {
			canvas.width = w;
			canvas.height = h;
		}
		gl.viewport(0, 0, canvas.width, canvas.height);

		const lerp = 0.06;
		this.pointerCurrent.x += (this.pointerTarget.x - this.pointerCurrent.x) * lerp;
		this.pointerCurrent.y += (this.pointerTarget.y - this.pointerCurrent.y) * lerp;

		const t = performance.now() / 1000 - this.startTime;
		const driftX = Math.sin(t * 0.3) * 0.002;
		const driftY = Math.cos(t * 0.4) * 0.001;

		gl.useProgram(this.program);
		gl.uniform2f(this.locs.u_pointer, this.pointerCurrent.x + driftX, this.pointerCurrent.y + driftY);
		gl.uniform1f(this.locs.u_intensity, this.intensity);

		if (this.imageTex) {
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.imageTex);
		}
		if (this.depthTex) {
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, this.depthTex);
		}

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		this.raf = requestAnimationFrame(this.tick);
	};
}
