// UI-facing aliases of application read models. UI never imports Prisma or provider SDKs.
import type { z } from "zod";
import type {
  availabilitySchema,
  MediaViewModel,
  ProductSummary,
  VariantView,
} from "@/application/catalogue/views";

export type Availability = z.infer<typeof availabilitySchema>;
export type MediaView = MediaViewModel;
export type { ProductSummary, VariantView };
