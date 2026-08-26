import { z } from "zod";

export const voteCheckoutSchema = z.object({
  contestantId: z.string().min(1),
  eventId: z.string().min(1),
  voteQuantity: z.coerce.number().int().min(1).max(10_000),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().min(9).max(20),
  customerName: z.string().max(80).optional().or(z.literal("")),
});

export const ticketCheckoutSchema = z.object({
  eventId: z.string().min(1),
  ticketId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(20),
  customerName: z.string().min(2).max(80),
  customerPhone: z.string().min(7).max(20),
  customerEmail: z.string().email(),
});

export const contactSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().max(20).optional().or(z.literal("")),
  subject: z.string().min(3).max(120),
  message: z.string().min(10).max(2000),
});

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  organizationName: z.string().min(2).max(120),
  phone: z.string().min(7).max(20),
});

export const eventFormSchema = z.object({
  name: z.string().min(3).max(120),
  description: z.string().min(20).max(5000),
  location: z.string().min(2).max(120),
  venue: z.string().min(2).max(120),
  eventDate: z.string().min(1),
  votingStart: z.string().optional().or(z.literal("")),
  votingEnd: z.string().optional().or(z.literal("")),
  votePrice: z.coerce.number().int().min(1).max(10_000),
  mode: z.enum(["VOTING_ONLY", "TICKETS_ONLY", "VOTING_AND_TICKETS"]),
  voteVisibility: z.enum(["VISIBLE", "HIDDEN", "AFTER_CLOSE"]),
  status: z.enum(["DRAFT", "UPCOMING", "LIVE", "COMPLETED", "DISABLED"]).optional(),
  poster: z.string().min(1),
  banner: z.string().min(1),
});

export const contestantFormSchema = z.object({
  name: z.string().min(2).max(80),
  contestantNumber: z.string().min(1).max(10),
  category: z.string().min(2).max(80),
  bio: z.string().min(10).max(4000),
  image: z.string().min(1),
  instagram: z.string().url().optional().or(z.literal("")),
  twitter: z.string().url().optional().or(z.literal("")),
  tiktok: z.string().url().optional().or(z.literal("")),
  facebook: z.string().url().optional().or(z.literal("")),
});

export const ticketFormSchema = z.object({
  name: z.string().min(2).max(40),
  price: z.coerce.number().int().min(0).max(1_000_000),
  quantity: z.coerce.number().int().min(1).max(100_000),
});
