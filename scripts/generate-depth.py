# /// script
# requires-python = ">=3.14"
# dependencies = ["torch", "transformers", "pillow"]
# ///

import sys
from pathlib import Path

from PIL import Image
from transformers import pipeline
import torch

SIZES = {
	"thumb": 400,
	"medium": 1200,
	"full": 2400,
}


def process_directory(input_dir: Path, output_dir: Path):
	output_dir.mkdir(parents=True, exist_ok=True)

	device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
	pipe = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device=device)

	extensions = {".jpg", ".jpeg", ".png", ".webp", ".tiff"}
	images = sorted(p for p in input_dir.iterdir() if p.suffix.lower() in extensions)

	if not images:
		print(f"No images found in {input_dir}")
		return

	for img_path in images:
		stem = img_path.stem
		print(f"Processing {img_path.name}...")

		img = Image.open(img_path).convert("RGB")

		result = pipe(img)
		depth = result["depth"]

		for label, max_w in SIZES.items():
			if img.width > max_w:
				ratio = max_w / img.width
				new_h = int(img.height * ratio)
				resized = img.resize((max_w, new_h), Image.LANCZOS)
				depth_resized = depth.resize((max_w, new_h), Image.LANCZOS)
			else:
				resized = img
				depth_resized = depth

			photo_out = output_dir / f"{stem}-{label}.webp"
			resized.save(photo_out, "WEBP", quality=85)

			depth_out = output_dir / f"{stem}-{label}-depth.webp"
			depth_resized.convert("L").save(depth_out, "WEBP", quality=80)

			print(f"  {label}: {photo_out.name}, {depth_out.name}")

	print("Done.")


if __name__ == "__main__":
	if len(sys.argv) < 2:
		print(f"Usage: uv run {sys.argv[0]} <input_dir> [output_dir]")
		sys.exit(1)

	input_dir = Path(sys.argv[1])
	output_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else input_dir / "output"
	process_directory(input_dir, output_dir)
