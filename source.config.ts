import { defineDocs, defineConfig, frontmatterSchema } from "fumadocs-mdx/config";
import { z } from "zod";

export const docs = defineDocs({
  dir: "docs",
  docs: {
    schema: frontmatterSchema.extend({
      // Roles allowed to view this page. Defaults to ['admin'] if not specified.
      allowedRoles: z.array(z.enum(["admin", "data_manager"])).optional(),
    }),
  },
});

export default defineConfig();
