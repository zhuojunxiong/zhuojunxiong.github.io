import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://zhuojunxiong.github.io",
  output: "static",
  markdown: {
    shikiConfig: {
      theme: "github-dark",
      wrap: true,
    },
  },
});
