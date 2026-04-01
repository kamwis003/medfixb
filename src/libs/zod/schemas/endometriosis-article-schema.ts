import { z } from "zod"

export const endometriosisArticleSchema = z.object({
  title: z.string()
    .min(1, { message: "Title is required" })
    .max(100, { message: "Title must be at most 100 characters" }),
  content: z.string()
    .min(1, { message: "Content is required" })
    .max(4000, { message: "Content must be at most 4000 characters" }),
})

export type TCreateEndometriosisArticle = z.infer<typeof endometriosisArticleSchema>
