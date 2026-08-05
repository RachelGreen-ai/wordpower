import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getLesson, lessons } from "../lib/lessons";

const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ??
  "https://wordpower-seven.vercel.app";

const SITE_NAME = "Word Power, Reread";
const DEFAULT_DESCRIPTION =
  "Bilingual English and Mandarin vocabulary lessons with etymology, pronunciation audio, word-family expansion, and active recall tests.";

interface SeoState {
  title: string;
  description: string;
  canonicalPath: string;
  keywords: string[];
  schema: Record<string, unknown>;
}

function absoluteUrl(pathname: string) {
  return `${SITE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

function setMetaAttribute(attribute: "name" | "property", key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setCanonical(href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement("link");
    tag.rel = "canonical";
    document.head.appendChild(tag);
  }
  tag.href = href;
}

function setJsonLd(schema: Record<string, unknown>) {
  const id = "structured-data";
  let tag = document.getElementById(id) as HTMLScriptElement | null;
  if (!tag) {
    tag = document.createElement("script");
    tag.id = id;
    tag.type = "application/ld+json";
    document.head.appendChild(tag);
  }
  tag.text = JSON.stringify(schema);
}

function baseGraph(pathname: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        alternateName: "逐词重读",
        url: SITE_URL,
        inLanguage: ["en", "zh-CN"],
        description: DEFAULT_DESCRIPTION,
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/#app`,
        name: SITE_NAME,
        url: SITE_URL,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Any",
        inLanguage: ["en", "zh-CN"],
        isAccessibleForFree: true,
        description: DEFAULT_DESCRIPTION,
        featureList: [
          "Root-based vocabulary lessons",
          "Bilingual English and Mandarin explanations",
          "Pronunciation audio",
          "Active recall vocabulary tests",
          "Word-family expansion by etymology",
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${absoluteUrl(pathname)}#webpage`,
        url: absoluteUrl(pathname),
        isPartOf: { "@id": `${SITE_URL}/#website` },
        inLanguage: ["en", "zh-CN"],
      },
    ],
  };
}

function seoForPath(pathname: string): SeoState {
  if (pathname === "/method") {
    const title = "Learn Vocabulary Roots, Not Lists | Word Power, Reread";
    const description =
      "Learn English vocabulary through Latin and Greek roots, bilingual Mandarin notes, root families, and a searchable etymology atlas.";
    return {
      title,
      description,
      canonicalPath: "/method",
      keywords: [
        "vocabulary roots",
        "English etymology",
        "Latin Greek roots",
        "Mandarin English vocabulary",
        "Word Power Made Easy method",
      ],
      schema: {
        ...baseGraph("/method"),
        "@graph": [
          ...baseGraph("/method")["@graph"],
          {
            "@type": "FAQPage",
            "@id": `${SITE_URL}/method#faq`,
            mainEntity: [
              {
                "@type": "Question",
                name: "How does root-based vocabulary learning work?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Root-based vocabulary learning teaches Latin and Greek roots first, then connects each root to many related words so unfamiliar vocabulary becomes easier to decode.",
                },
              },
              {
                "@type": "Question",
                name: "Who is Word Power, Reread for?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Word Power, Reread is for English learners, especially Mandarin readers, who want etymology, pronunciation, examples, and active recall instead of isolated word lists.",
                },
              },
            ],
          },
        ],
      },
    };
  }

  if (pathname === "/test") {
    return {
      title: "Vocabulary Tests with Active Recall | Word Power, Reread",
      description:
        "Practice advanced English vocabulary with root matching, meaning recall, pronunciation prompts, and local scoring.",
      canonicalPath: "/test",
      keywords: ["vocabulary test", "active recall vocabulary", "English vocabulary quiz", "pronunciation practice"],
      schema: baseGraph("/test"),
    };
  }

  const lessonMatch = pathname.match(/^\/lesson\/([^/]+)$/);
  if (lessonMatch) {
    const lesson = getLesson(decodeURIComponent(lessonMatch[1]));
    if (lesson) {
      const words = lesson.words.map((word) => word.word);
      const title = `${words.join(", ")} Vocabulary Lesson | Word Power, Reread`;
      const description = `${lesson.hook.headline.en} Learn ${words.join(", ")} with Mandarin meanings, pronunciation, etymology, examples, and word-family expansion.`;
      return {
        title,
        description,
        canonicalPath: `/lesson/${lesson.lessonId}`,
        keywords: [
          ...words,
          ...lesson.words.map((word) => word.chinese),
          ...(lesson.bookRef?.theme ? [lesson.bookRef.theme] : []),
          "English vocabulary lesson",
          "bilingual vocabulary",
          "etymology",
        ],
        schema: {
          ...baseGraph(`/lesson/${lesson.lessonId}`),
          "@graph": [
            ...baseGraph(`/lesson/${lesson.lessonId}`)["@graph"],
            {
              "@type": "LearningResource",
              "@id": `${SITE_URL}/lesson/${lesson.lessonId}#lesson`,
              name: `${words.join(", ")} vocabulary lesson`,
              headline: lesson.hook.headline.en,
              description,
              url: `${SITE_URL}/lesson/${lesson.lessonId}`,
              inLanguage: ["en", "zh-CN"],
              learningResourceType: "Vocabulary lesson",
              teaches: words,
              educationalLevel: "Intermediate to advanced English learners",
              isPartOf: {
                "@type": "Course",
                name: SITE_NAME,
                url: SITE_URL,
                numberOfLessons: lessons.length,
              },
              about: lesson.words.map((word) => ({
                "@type": "DefinedTerm",
                name: word.word,
                description: word.definition.en,
                inDefinedTermSet: SITE_NAME,
              })),
            },
          ],
        },
      };
    }
  }

  return {
    title: "Word Power, Reread | Bilingual Vocabulary and Etymology Lessons",
    description: DEFAULT_DESCRIPTION,
    canonicalPath: "/",
    keywords: [
      "Word Power Made Easy",
      "English vocabulary",
      "bilingual vocabulary",
      "Mandarin English learning",
      "etymology",
      "pronunciation",
      "vocabulary roots",
    ],
    schema: baseGraph("/"),
  };
}

export function Seo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const seo = seoForPath(pathname);
    const canonicalUrl = absoluteUrl(seo.canonicalPath);

    document.title = seo.title;
    document.documentElement.lang = "en";
    setMetaAttribute("name", "description", seo.description);
    setMetaAttribute("name", "keywords", seo.keywords.join(", "));
    setMetaAttribute("name", "robots", "index, follow, max-image-preview:large");
    setMetaAttribute("property", "og:site_name", SITE_NAME);
    setMetaAttribute("property", "og:title", seo.title);
    setMetaAttribute("property", "og:description", seo.description);
    setMetaAttribute("property", "og:type", "website");
    setMetaAttribute("property", "og:url", canonicalUrl);
    setMetaAttribute("name", "twitter:card", "summary");
    setMetaAttribute("name", "twitter:title", seo.title);
    setMetaAttribute("name", "twitter:description", seo.description);
    setCanonical(canonicalUrl);
    setJsonLd(seo.schema);
  }, [pathname]);

  return null;
}
