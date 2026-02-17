port := "3470"

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

tunnel:
	cloudflared tunnel --url http://localhost:{{port}}

ci: check build
