<script lang="ts">
	interface TablePhoto {
		src: string;
		title: string;
		caption?: string;
		w: number;
		h: number;
	}

	interface Props {
		photos: TablePhoto[];
	}

	let { photos }: Props = $props();

	let expandedIndex = $state<number | null>(null);

	function open(i: number) {
		if ('startViewTransition' in document) {
			(document as any).startViewTransition(() => {
				expandedIndex = i;
			});
		} else {
			expandedIndex = i;
		}
	}

	function close() {
		if ('startViewTransition' in document) {
			(document as any).startViewTransition(() => {
				expandedIndex = null;
			});
		} else {
			expandedIndex = null;
		}
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
		if (expandedIndex !== null) {
			if (e.key === 'ArrowRight') open((expandedIndex + 1) % photos.length);
			if (e.key === 'ArrowLeft') open((expandedIndex - 1 + photos.length) % photos.length);
		}
	}
</script>

<svelte:window onkeydown={onKeyDown} />

<section class="light-table" aria-label="Photo collection">
	<div class="masonry">
		{#each photos as photo, i}
			<button
				class="cell"
				onclick={() => open(i)}
				aria-label="View {photo.title}"
				style="view-transition-name: photo-{i}"
			>
				<img
					class="thumb"
					src={photo.src}
					alt={photo.title}
					loading="lazy"
					width={photo.w}
					height={photo.h}
				/>
				<div class="cell-overlay">
					<span class="cell-title">{photo.title}</span>
				</div>
			</button>
		{/each}
	</div>
</section>

<!-- Lightbox -->
{#if expandedIndex !== null}
	{@const photo = photos[expandedIndex]}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="lightbox" role="presentation" onclick={close}>
		<div class="lightbox-inner" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={photo.title} tabindex="-1" style="view-transition-name: photo-{expandedIndex}">
			<img class="lightbox-img" src={photo.src} alt={photo.title} />
			<div class="lightbox-info">
				<h2>{photo.title}</h2>
				{#if photo.caption}
					<p>{photo.caption}</p>
				{/if}
			</div>
			<button class="lightbox-close" onclick={close} aria-label="Close">×</button>
			<button class="lightbox-prev" onclick={() => open((expandedIndex! - 1 + photos.length) % photos.length)} aria-label="Previous">‹</button>
			<button class="lightbox-next" onclick={() => open((expandedIndex! + 1) % photos.length)} aria-label="Next">›</button>
		</div>
	</div>
{/if}

<style>
	.light-table {
		background: #080808;
		padding: 4rem 2rem;
		min-height: 100vh;
	}

	.masonry {
		max-width: 1400px;
		margin: 0 auto;
		columns: 3;
		column-gap: 4px;
	}

	@media (max-width: 900px) {
		.masonry { columns: 2; }
	}

	@media (max-width: 500px) {
		.masonry { columns: 1; }
	}

	.cell {
		position: relative;
		overflow: hidden;
		background: #111;
		border: none;
		cursor: pointer;
		padding: 0;
		display: block;
		width: 100%;
		margin-bottom: 4px;
		break-inside: avoid;
	}

	.thumb {
		display: block;
		width: 100%;
		height: auto;
		transition: transform 0.5s ease, filter 0.5s ease;
		filter: brightness(0.85);
	}

	.cell:hover .thumb {
		transform: scale(1.04);
		filter: brightness(1.05);
	}

	.cell-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: flex-end;
		padding: 0.75rem;
		background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.cell:hover .cell-overlay {
		opacity: 1;
	}

	.cell-title {
		color: #fff;
		font-size: 0.8rem;
		font-weight: 300;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	/* Lightbox */
	.lightbox {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: rgba(0, 0, 0, 0.92);
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(12px);
		animation: lb-in 0.25s ease both;
	}

	@keyframes lb-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.lightbox-inner {
		position: relative;
		max-width: min(90vw, 1200px);
		max-height: 90svh;
		display: flex;
		flex-direction: column;
	}

	.lightbox-img {
		display: block;
		max-width: 100%;
		max-height: 80svh;
		object-fit: contain;
		border-radius: 2px;
	}

	.lightbox-info {
		padding: 1rem 0 0;
		color: #e8e8e8;
	}

	.lightbox-info h2 {
		font-size: 1.1rem;
		font-weight: 300;
		letter-spacing: 0.05em;
	}

	.lightbox-info p {
		font-size: 0.85rem;
		opacity: 0.6;
		margin-top: 0.25rem;
	}

	.lightbox-close {
		position: absolute;
		top: -2.5rem;
		right: 0;
		background: none;
		border: none;
		color: rgba(255,255,255,0.6);
		font-size: 2rem;
		cursor: pointer;
		line-height: 1;
		transition: color 0.2s;
	}

	.lightbox-close:hover { color: #fff; }

	.lightbox-prev,
	.lightbox-next {
		position: fixed;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: rgba(255,255,255,0.5);
		font-size: 3rem;
		cursor: pointer;
		padding: 1rem;
		transition: color 0.2s;
		line-height: 1;
	}

	.lightbox-prev:hover,
	.lightbox-next:hover { color: #fff; }

	.lightbox-prev { left: 0.5rem; }
	.lightbox-next { right: 0.5rem; }

	/* View Transitions */
	@media (prefers-reduced-motion: no-preference) {
		::view-transition-old(*),
		::view-transition-new(*) {
			animation-duration: 0.35s;
		}
	}
</style>
