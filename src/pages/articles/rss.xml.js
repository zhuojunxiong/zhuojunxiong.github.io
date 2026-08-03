import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { siteConfig } from "../../site.config";
import { byDateDesc, isPublished, slugFromId } from "../../utils/content";

export async function GET(context) {
  const posts = (await getCollection("articles")).filter(isPublished).sort(byDateDesc);
  return rss({
    title: `${siteConfig.name} — Essays`,
    description: "Personal essays, reading notes, and observations beyond technology.",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedDate,
      link: `/articles/${slugFromId(post.id)}/`,
    })),
  });
}
