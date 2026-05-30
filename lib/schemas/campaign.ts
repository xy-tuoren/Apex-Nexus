import { z } from "zod";

export const advertisingTypeSchema = z.enum(["PERFORMANCE_MAX", "DEMAND_GEN"]);

export const idempotencyKeySchema = z
  .string()
  .min(8)
  .max(120)
  .regex(/^[a-zA-Z0-9:_-]+$/);

export const assetPayloadSchema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1).max(120),
  type: z.enum(["TEXT", "IMAGE", "LOGO", "YOUTUBE_VIDEO"]),
  text: z.string().max(120).optional(),
  url: z.string().url().optional(),
  youtubeVideoId: z.string().min(5).max(80).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const assetValidationSchema = z.object({
  advertisingType: advertisingTypeSchema,
  assets: z.object({
    headlines: z.array(z.string().min(1).max(30)).default([]),
    longHeadlines: z.array(z.string().min(1).max(90)).default([]),
    descriptions: z.array(z.string().min(1).max(90)).default([]),
    businessName: z.string().min(1).max(25),
    marketingImages: z.array(z.string()).default([]),
    squareMarketingImages: z.array(z.string()).default([]),
    logos: z.array(z.string()).default([]),
    youtubeVideos: z.array(z.string()).default([]),
  }),
});

export const campaignDraftSchema = z.object({
  siteId: z.string().min(1),
  adAccountId: z.string().min(1),
  advertisingType: advertisingTypeSchema,
  name: z.string().min(3).max(120),
  finalUrl: z.string().url(),
  budgetMicros: z.number().int().min(1_000_000),
  bidding: z.object({
    strategy: z.enum([
      "MAXIMIZE_CONVERSIONS",
      "MAXIMIZE_CONVERSION_VALUE",
      "TARGET_CPA",
      "TARGET_ROAS",
    ]),
    targetCpaMicros: z.number().int().positive().optional(),
    targetRoas: z.number().positive().optional(),
  }),
  locations: z.array(z.string().min(1)).min(1),
  language: z.string().min(2),
  assets: assetValidationSchema.shape.assets,
  demandGen: z
    .object({
      adGroupName: z.string().min(3).max(120),
      selectedChannels: z.object({
        youtubeInFeed: z.boolean(),
        youtubeInStream: z.boolean(),
        youtubeShorts: z.boolean(),
        discover: z.boolean(),
        gmail: z.boolean(),
        display: z.boolean(),
      }),
    })
    .optional(),
});

export const launchJobSchema = z.object({
  draftId: z.string().min(1),
  idempotencyKey: idempotencyKeySchema,
});

export const campaignActionSchema = z.object({
  idempotencyKey: idempotencyKeySchema.optional(),
});

export const budgetUpdateSchema = z.object({
  idempotencyKey: idempotencyKeySchema.optional(),
  budgetMicros: z.number().int().min(1_000_000),
});

export type CampaignDraftInput = z.infer<typeof campaignDraftSchema>;
export type AssetInput = z.infer<typeof assetPayloadSchema>;
