import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const requiredText = z.string().trim().min(1);
const publicAssetPath = requiredText.regex(/^\/(?!\/)/);

const optionalCover = {
  cover: publicAssetPath.optional(),
  coverAlt: requiredText.optional(),
};

const tech = defineCollection({
  loader: glob({ base: "./src/content/tech", pattern: "**/*.{md,mdx}" }),
  schema: z
    .object({
      title: requiredText,
      description: requiredText,
      publishedDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(requiredText).min(1),
      ...optionalCover,
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
      series: requiredText.optional(),
      difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
    })
    .refine((data) => !data.cover || Boolean(data.coverAlt), {
      message: "coverAlt is required when a cover image is provided",
    }),
});

const photography = defineCollection({
  loader: glob({ base: "./src/content/photography", pattern: "**/*.json" }),
  schema: z.object({
    title: requiredText,
    description: requiredText,
    date: z.coerce.date(),
    location: requiredText.optional(),
    cover: publicAssetPath,
    coverAlt: requiredText,
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    camera: requiredText.optional(),
    lens: requiredText.optional(),
    photos: z
      .array(
        z.object({
          src: publicAssetPath,
          alt: requiredText,
          caption: requiredText.optional(),
          width: z.number().int().positive(),
          height: z.number().int().positive(),
        }),
      )
      .min(1),
  }),
});

const articles = defineCollection({
  loader: glob({ base: "./src/content/articles", pattern: "**/*.{md,mdx}" }),
  schema: z
    .object({
      title: requiredText,
      description: requiredText,
      publishedDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      category: requiredText,
      ...optionalCover,
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    })
    .refine((data) => !data.cover || Boolean(data.coverAlt), {
      message: "coverAlt is required when a cover image is provided",
    }),
});

export const collections = { tech, photography, articles };
