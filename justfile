install:
	pnpm install

dev: install
	pnpm dev

build: install
	pnpm build

check: install
	pnpm check

preview: install
	pnpm preview

depth dir:
	uv run scripts/generate-depth.py {{dir}}

ci: check build
