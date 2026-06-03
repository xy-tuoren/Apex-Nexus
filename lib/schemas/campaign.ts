import { z } from "zod";

export const advertisingTypeSchema = z.enum(["DEMAND_GEN"]);

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
    headlines: z.array(z.string().min(1).max(40)).default([]),
    longHeadlines: z.array(z.string().min(1).max(90)).default([]),
    descriptions: z.array(z.string().min(1).max(90)).default([]),
    businessName: z.string().min(1).max(25),
    marketingImages: z.array(z.string()).default([]),
    squareMarketingImages: z.array(z.string()).default([]),
    logos: z.array(z.string()).default([]),
    youtubeVideos: z.array(z.string()).default([]),
  }),
});

export const adCreativeDraftSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1).max(120),
  finalUrl: z.string().url(),
  youtubeVideos: z.array(z.string().min(1)).default([]),
  logos: z.array(z.string().min(1)).default([]),
  headlines: z.array(z.string().min(1).max(40)).default([]),
  longHeadlines: z.array(z.string().min(1).max(90)).default([]),
  descriptions: z.array(z.string().min(1).max(90)).default([]),
  callToAction: z.string().min(1).max(40),
  businessName: z.string().min(1).max(25),
});

export const adGroupDraftSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1).max(120),
  locations: z.array(z.string().min(1)).min(1),
  audienceSignals: z.array(z.string().min(1)).default([]),
  language: z.string().min(2),
  demographics: z
    .object({
      genders: z.array(z.string().min(1)).default([]),
      ageRange: z.object({
        ranges: z.array(z.string().min(1)).default([]),
        includeUnknown: z.boolean(),
      }),
    })
    .optional(),
  ads: z.array(adCreativeDraftSchema).min(1),
});

export const campaignDraftSchema = z.object({
  siteId: z.string().min(1).optional(),
  adAccountId: z.string().min(1),
  advertisingType: advertisingTypeSchema,
  name: z.string().min(3).max(120),
  campaignObjective: z.string().min(1).max(80).optional(),
  conversionGoal: z.string().min(1).max(160).optional(),
  finalUrl: z.string().url(),
  budgetMicros: z.number().int().min(1_000_000),
  bidding: z
    .object({
      strategy: z.enum([
        "MAXIMIZE_CONVERSIONS",
        "MAXIMIZE_CLICKS",
        "MAXIMIZE_CONVERSION_VALUE",
        "TARGET_CPA",
        "TARGET_ROAS",
      ]),
      targetCpaMicros: z.number().int().positive().optional(),
      maxCpcBidCeilingMicros: z.number().int().positive().optional(),
      targetRoas: z.number().positive().optional(),
    })
    .superRefine((bidding, context) => {
      if (bidding.strategy === "TARGET_CPA" && !bidding.targetCpaMicros) {
        context.addIssue({
          code: "custom",
          path: ["targetCpaMicros"],
          message: "TARGET_CPA bidding requires targetCpaMicros.",
        });
      }
    }),
  locations: z.array(z.string().min(1)).min(1),
  language: z.string().min(2),
  os: z.string().min(1).default("all"),
  oss: z.array(z.string().min(1)).default([]),
  device: z.string().min(1).default("all"),
  devices: z.array(z.string().min(1)).default([]),
  adSchedule: z.string().max(240).optional(),
  urlPrefix: z.string().max(500).optional(),
  trackingTemplate: z.string().max(500).optional(),
  finalUrlSuffix: z.string().max(500).optional(),
  ipExclusions: z.array(z.string().min(1)).default([]),
  assets: assetValidationSchema.shape.assets,
  demandGen: z
    .object({
      adGroupName: z.string().min(3).max(120),
    })
    .optional(),
  adGroups: z.array(adGroupDraftSchema).min(1).optional(),
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
