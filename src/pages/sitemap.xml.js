import { getCollection } from "astro:content";
import { siteConfig } from "../site.config";
import { byDateDesc, isPublished, slugFromId } from "../utils/content";

const staticPages = ["/", "/tech/", "/photography/", "/articles/", "/about/"];

export async function GET() {
  const tech = (await getCollection("tech")).filter(isPublished).sort(byDateDesc);
  const articles = (await getCollection("articles")).filter(isPublished).sort(byDateDesc);
  const photography = (await getCollection("photography")).filter(isPublished);

  const urls = [
    ...staticPages.map((url) => ({ url })),
    ...tech.map((entry) => ({
      url: `/tech/${slugFromId(entry.id)}/`,
      lastModified: entry.data.updatedDate ?? entry.data.publishedDate,
    })),
    ...articles.map((entry) => ({
      url: `/articles/${slugFromId(entry.id)}/`,
      lastModified: entry.data.updatedDate ?? entry.data.publishedDate,
    })),
    ...photography.map((entry) => ({
      url: `/photography/${entry.id.replace(/\.json$/, "")}/`,
      lastModified: entry.data.date,
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ url, lastModified }) =>
      `  <url><loc>${new URL(url, siteConfig.url).toString()}</loc>${lastModified ? `<lastmod>${lastModified.toISOString().slice(0, 10)}</lastmod>` : ""}</url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
