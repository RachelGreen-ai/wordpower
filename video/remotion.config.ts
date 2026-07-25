import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(null); // auto-detect cores
Config.setEntryPoint("./src/index.ts");
Config.setOutputLocation("out/output.mp4");

// Serve static assets (pronunciation audio) from the learning site's public
// dir — the single source of truth shared with web/ and authoring/. So
// staticFile("audio/vocab/<id>/<slot>.wav") resolves to ../web/public/audio/...
Config.setPublicDir("../web/public");
