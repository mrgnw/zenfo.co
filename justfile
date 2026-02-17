dev:
	pnpm dev

build:
	pnpm build

check:
	pnpm check

preview:
	pnpm preview

depth dir:
	uv run scripts/generate-depth.py {{dir}}

ci: check build
