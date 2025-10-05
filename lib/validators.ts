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
  holidayName: z.string().min(1, 'Holiday name is required'),
  services: z.array(z.string()).min(1, 'At least one service is required'),
  items: z.array(z.object({
    title: z.string().min(1, 'Title is required'),
    service: z.string().min(1, 'Service is required'),
    honor: z.string().min(1, 'Honor is required'),
    description: z.string().optional(),
    startingBid: z.number().min(0),
    minimumIncrement: z.number().min(1).default(1),
    displayOrder: z.number(),
  })).min(1, 'At least one item is required')
});

export const LoginSchema = z.object({
  password: z.string().min(1, 'Password is required')
});