// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Lang } from '$lib/lang';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			lang: Lang;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
