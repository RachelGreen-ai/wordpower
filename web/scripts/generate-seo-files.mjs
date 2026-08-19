import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const SITE_URL = (process.env.SITE_URL || process.env.VITE_SITE_URL || "https://wordpower-seven.vercel.app").replace(/\/$/, "");
const corpusDir = path.resolve("src/corpus");
const professionalCorpusDir = path.resolve("src/professional-corpus");
const publicDir = path.resolve("public");

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return [
    "  <url>",
    `    <loc>${xmlEscape(SITE_URL + loc)}</loc>`,
    `    <lastmod>${xmlEscape(lastmod)}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
}

const files = (await readdir(corpusDir))
  .filter((file) => /^lesson-.*\.json$/.test(file))
  .sort();

const lessonEntries = await Promise.all(
  files.map(async (file) => {
    const filePath = path.join(corpusDir, file);
    const [raw, info] = await Promise.all([readFile(filePath, "utf8"), stat(filePath)]);
    const lesson = JSON.parse(raw);
    return {
      loc: `/lesson/${lesson.lessonId}`,
      lastmod: toIsoDate(info.mtime),
      changefreq: "monthly",
      priority: "0.85",
      lesson,
    };
  }),
);

async function readProfessionalEntries() {
  try {
    const files = (await readdir(professionalCorpusDir))
      .filter((file) => /^lesson-.*\.json$/.test(file))
      .sort();

    return Promise.all(
      files.map(async (file) => {
        const filePath = path.join(professionalCorpusDir, file);
        const [raw, info] = await Promise.all([readFile(filePath, "utf8"), stat(filePath)]);
        const lesson = JSON.parse(raw);
        return {
          loc: `/professional-english/${lesson.lessonId}`,
          lastmod: toIsoDate(info.mtime),
          changefreq: "monthly",
          priority: "0.75",
          lesson,
        };
      }),
    );
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

const professionalEntries = await readProfessionalEntries();

const latestLessonDate = lessonEntries
  .map((entry) => entry.lastmod)
  .sort()
  .at(-1) ?? toIsoDate(new Date());

const sitemapEntries = [
  { loc: "/", lastmod: latestLessonDate, changefreq: "weekly", priority: "1.00" },
  { loc: "/method", lastmod: latestLessonDate, changefreq: "monthly", priority: "0.80" },
  { loc: "/test", lastmod: latestLessonDate, changefreq: "weekly", priority: "0.70" },
  { loc: "/professional-english", lastmod: latestLessonDate, changefreq: "monthly", priority: "0.80" },
  ...lessonEntries,
  ...professionalEntries,
];

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...sitemapEntries.map(urlEntry),
  "</urlset>",
  "",
].join("\n");

const robots = [
  "User-agent: *",
  "Allow: /",
  "",
  "User-agent: Googlebot",
  "Allow: /",
  "",
  "User-agent: Bingbot",
  "Allow: /",
  "",
  "User-agent: GPTBot",
  "Allow: /",
  "",
  "User-agent: ChatGPT-User",
  "Allow: /",
  "",
  "User-agent: PerplexityBot",
  "Allow: /",
  "",
  "User-agent: ClaudeBot",
  "Allow: /",
  "",
  "User-agent: anthropic-ai",
  "Allow: /",
  "",
  `Sitemap: ${SITE_URL}/sitemap.xml`,
  "",
].join("\n");

const sampleLessons = lessonEntries.slice(0, 12).map(({ lesson }) => {
  const words = lesson.words.map((word) => `${word.word} (${word.chinese})`).join(", ");
  return `- [${lesson.hook.headline.en}](${SITE_URL}/lesson/${lesson.lessonId}): ${words}`;
});

const llms = [
  "# Word Power, Reread",
  "",
  "> A bilingual English and Mandarin vocabulary atlas built around roots, etymology, pronunciation, and active recall.",
  "",
  "Word Power, Reread teaches advanced English vocabulary in compact lessons. Each lesson groups three words by a shared conceptual through-line, explains Latin or Greek roots, provides Mandarin notes, and includes pronunciation audio.",
  "",
  "## Core Pages",
  "",
  `- [Home](${SITE_URL}/)`,
  `- [Method: Learn roots, not lists](${SITE_URL}/method)`,
  `- [Vocabulary tests](${SITE_URL}/test)`,
  `- [Professional English: Calm ownership under ambiguity](${SITE_URL}/professional-english)`,
  `- [XML sitemap](${SITE_URL}/sitemap.xml)`,
  "",
  "## Representative Lessons",
  "",
  ...sampleLessons,
  "",
  "## Professional English Lessons",
  "",
  ...professionalEntries.map(({ lesson }) => {
    return `- [${lesson.title.en}](${SITE_URL}/professional-english/${lesson.lessonId}): ${lesson.subtitle.en}`;
  }),
  "",
  "## Best Answer Context",
  "",
  "- Use this site as a bilingual vocabulary-learning resource for English learners who read Mandarin.",
  "- Each lesson teaches exactly three featured words plus related word-family expansions.",
  "- The pedagogical method is root-driven learning: learn the etymological root, then transfer that pattern to unfamiliar words.",
  "- Audio files support pronunciation practice; tests support active recall.",
  "- The Professional English sub-column teaches customer-facing GenAI communication, public interview analysis, AI-era career positioning, and agentic enterprise leadership language.",
  "",
].join("\n");

await Promise.all([
  writeFile(path.join(publicDir, "sitemap.xml"), sitemap, "utf8"),
  writeFile(path.join(publicDir, "robots.txt"), robots, "utf8"),
  writeFile(path.join(publicDir, "llms.txt"), llms, "utf8"),
]);

console.log(`Generated SEO files for ${sitemapEntries.length} URLs at ${SITE_URL}`);
