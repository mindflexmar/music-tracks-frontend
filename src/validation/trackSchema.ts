import { z } from "zod";

export const trackSchema = z.object({
  title: z.string().min(1, "Title is required"),
  artist: z.string().min(1, "Artist is required"),
  album: z.string().optional(),
  coverImage: z.string().url("Cover must be a valid URL").optional(),
  genres: z.array(z.string()).optional(),
});
