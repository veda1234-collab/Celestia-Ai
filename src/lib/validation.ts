import { z } from 'zod';

export const placeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string(),
  countryCode: z.string().optional(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  timezone: z.string().min(1),
});

export const birthDetailsSchema = z.object({
  fullName: z.string().min(1, 'Name is required').max(120),
  gender: z.enum(['male', 'female', 'other', 'prefer_not']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:mm'),
  place: placeSchema,
  currentLocation: placeSchema.nullable().optional(),
  email: z.string().email().nullable().optional(),
  language: z.string().default('en'),
  system: z.enum(['vedic', 'western']).optional(),
});

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(50),
  // Chart is trusted structurally; validated loosely to keep the payload light.
  chart: z.object({ meta: z.object({ name: z.string() }) }).passthrough(),
  language: z.string().optional(),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name is required').max(120),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters').max(200),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const saveChartSchema = z.object({
  label: z.string().min(1).max(120),
  details: birthDetailsSchema,
  chart: z.object({ meta: z.object({ name: z.string() }) }).passthrough(),
});

export type BirthDetailsInput = z.infer<typeof birthDetailsSchema>;
