import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Allow serving files from the parent Remotion project — the lesson JSON
// and audio wavs live there. site/src/corpus and site/public/audio are
// symlinks back into the parent.
// Honor PORT env var so the Claude Code preview MCP can drive Vite onto
// whatever port it assigns (otherwise Vite finds its own free port and the
// preview proxy can't reach it). `strictPort: true` makes Vite fail loudly
// instead of silently choosing the next port.
const PORT = Number(process.env.PORT) || 5173;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: PORT,
    strictPort: !!process.env.PORT,
    fs: {
      allow: [".."],
    },
  },
});
