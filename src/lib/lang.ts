export type Lang = 'en' | 'es';

export const LANGS: Lang[] = ['en', 'es'];

const isLang = (value: string): value is Lang => (LANGS as string[]).includes(value);

/**
 * English is the default. Spanish turns on when the visitor is in Spain or
 * their browser's top language preference is Spanish. `override` (a ?lang=
 * query value) always wins so anyone can opt back out.
 */
export function detectLang(
	acceptLanguage: string | null,
	country: string | null,
	override?: string | null
): Lang {
	if (override && isLang(override)) return override;
	if (country?.toUpperCase() === 'ES') return 'es';

	const preferred = acceptLanguage?.split(',')[0]?.trim().toLowerCase() ?? '';
	return preferred.startsWith('es') ? 'es' : 'en';
}
