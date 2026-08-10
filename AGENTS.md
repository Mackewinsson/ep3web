<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Domain: quote / mudanza pricing

Volume, packing boxes, and budget line math live in **`src/lib/quote-pricing/`** (see `AGENTS.md` there). Do not reimplement in UI. Admin configures values at `/panel/cotizador`.
