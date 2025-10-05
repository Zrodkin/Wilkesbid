// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// lib/validators.ts
import { z } from 'zod';

export const BidSchema = z.object({
  itemId: z.string().uuid(),
  fullName: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  bidAmount: z.number().positive('Bid must be positive'),
});

export const StartAuctionSchema = z.object({
  endDate: z.string().datetime(),
  items: z.array(z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    startingBid: z.number().min(0),
    minimumIncrement: z.number().min(1).default(1),
  })).min(1, 'At least one item is required')
});

export const LoginSchema = z.object({
  password: z.string().min(1, 'Password is required')
});