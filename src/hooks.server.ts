import type { Handle } from '@sveltejs/kit';
import { detectLang } from '$lib/lang';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.lang = detectLang(
		event.request.headers.get('accept-language'),
		event.request.headers.get('cf-ipcountry'),
		event.url.searchParams.get('lang')
	);

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.lang)
	});
};
