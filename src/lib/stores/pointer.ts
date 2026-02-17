import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const pointer = writable({ x: 0, y: 0 });

if (browser) {
	let targetX = 0;
	let targetY = 0;
	let currentX = 0;
	let currentY = 0;
	let ticking = false;

	function tick() {
		currentX += (targetX - currentX) * 0.06;
		currentY += (targetY - currentY) * 0.06;
		pointer.set({ x: currentX, y: currentY });
		if (Math.abs(targetX - currentX) > 0.0001 || Math.abs(targetY - currentY) > 0.0001) {
			requestAnimationFrame(tick);
		} else {
			ticking = false;
		}
	}

	function startTick() {
		if (!ticking) {
			ticking = true;
			requestAnimationFrame(tick);
		}
	}

	window.addEventListener('mousemove', (e) => {
		targetX = (e.clientX / window.innerWidth) * 2 - 1;
		targetY = (e.clientY / window.innerHeight) * 2 - 1;
		startTick();
	});

	window.addEventListener('deviceorientation', (e) => {
		if (e.gamma !== null && e.beta !== null) {
			targetX = Math.max(-1, Math.min(1, e.gamma / 30));
			targetY = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
			startTick();
		}
	});
}
