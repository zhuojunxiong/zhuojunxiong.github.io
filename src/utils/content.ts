import type { CollectionEntry } from "astro:content";

export function isPublished<
  T extends { data: { draft?: boolean; publishedDate?: Date; date?: Date } },
>(entry: T) {
  const publishDate = entry.data.publishedDate ?? entry.data.date;
  return !entry.data.draft && (!publishDate || Number(publishDate) <= Date.now());
}

export function byDateDesc<T extends { data: { publishedDate?: Date; date?: Date } }>(a: T, b: T) {
  const first = a.data.publishedDate ?? a.data.date;
  const second = b.data.publishedDate ?? b.data.date;
  return Number(second) - Number(first);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function slugFromId(id: string) {
  return id.replace(/\.(md|mdx|json)$/i, "");
}

export function neighbors<T extends CollectionEntry<"tech"> | CollectionEntry<"articles">>(
  entries: T[],
  slug: string,
) {
  const index = entries.findIndex((entry) => slugFromId(entry.id) === slug);
  return {
    previous: index > 0 ? entries[index - 1] : undefined,
    next: index >= 0 && index < entries.length - 1 ? entries[index + 1] : undefined,
  };
}
