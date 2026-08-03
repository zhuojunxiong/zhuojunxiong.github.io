import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { siteConfig } from "../../site.config";
import { byDateDesc, isPublished, slugFromId } from "../../utils/content";

export async function GET(context) {
  const posts = (await getCollection("tech")).filter(isPublished).sort(byDateDesc);
  return rss({
    title: `${siteConfig.name} — Technology`,
    description: "Technical guides, explanations, development notes, and lessons learned.",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedDate,
      link: `/tech/${slugFromId(post.id)}/`,
    })),
  });
}
