import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectLang } from './lang.ts';

test('english is the default', () => {
	assert.equal(detectLang(null, null), 'en');
	assert.equal(detectLang('en-US,en;q=0.9', 'US'), 'en');
	assert.equal(detectLang('fr-FR,fr;q=0.9', 'FR'), 'en');
});

test('spanish from browser language', () => {
	assert.equal(detectLang('es-ES,es;q=0.9,en;q=0.8', 'US'), 'es');
	assert.equal(detectLang('es-419,es;q=0.9', 'MX'), 'es');
	assert.equal(detectLang('ES', null), 'es');
});

test('spanish from country', () => {
	assert.equal(detectLang('en-GB,en;q=0.9', 'ES'), 'es');
	assert.equal(detectLang('en-GB,en;q=0.9', 'es'), 'es');
});

test('secondary browser preference does not trigger spanish', () => {
	assert.equal(detectLang('en-US,en;q=0.9,es;q=0.8', 'US'), 'en');
});

test('query override wins', () => {
	assert.equal(detectLang('es-ES', 'ES', 'en'), 'en');
	assert.equal(detectLang('en-US', 'US', 'es'), 'es');
	assert.equal(detectLang('en-US', 'US', 'klingon'), 'en');
});
