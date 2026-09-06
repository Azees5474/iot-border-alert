# Hero video

Place your cinematic maritime/fishing-boat footage here as:

    fishing-boat.mp4        (compressed, 720p–1080p, a few MB — not 4K)
    fishing-boat-poster.jpg (a single representative frame, shown before the video loads)

The Dashboard hero (`src/components/MaritimeHero.tsx`) looks for these two files.
If they are missing or fail to load, the hero automatically falls back to a dark
ocean gradient + technical grid background — the page will never show a broken
video element or crash.

Recommended source: royalty-free stock footage (e.g. Pexels, Pixabay) searched
for "fishing boat aerial drone ocean" or similar, re-encoded with:

    ffmpeg -i input.mp4 -vf scale=-2:1080 -c:v libx264 -crf 28 -preset slow -an fishing-boat.mp4
