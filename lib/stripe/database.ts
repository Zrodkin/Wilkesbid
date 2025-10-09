// lib/stripe/database.ts
import { createServiceClient as createClient } from '@/lib/supabase/service';

export interface StripeAccount {
  id: string;
  stripe_account_id: string;
  access_token?: string;
  refresh_token?: string;
  stripe_user_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get the connected Stripe account (there should only be one)
 */
export async function getStripeAccount(): Promise<StripeAccount | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('stripe_accounts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching Stripe account:', error);
    return null;
  }
  
  return data;
}

/**
 * Save Stripe account credentials after OAuth
 */
export async function saveStripeAccount(data: {
  stripe_account_id: string;
  access_token?: string;
  refresh_token?: string;
  stripe_user_id?: string;
}): Promise<StripeAccount | null> {
  const supabase = await createClient();
  
  // Check if account already exists
  const existing = await getStripeAccount();
  
  if (existing) {
    // Update existing account
    const { data: updated, error } = await supabase
      .from('stripe_accounts')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating Stripe account:', error);
      return null;
    }
    
    return updated;
  } else {
    // Create new account
    const { data: created, error } = await supabase
      .from('stripe_accounts')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating Stripe account:', error);
      return null;
    }
    
    return created;
  }
}

/**
 * Delete Stripe account (disconnect)
 */
export async function deleteStripeAccount(): Promise<boolean> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('stripe_accounts')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  
  if (error) {
    console.error('Error deleting Stripe account:', error);
    return false;
  }
  
  return true;
}

/**
 * Check if Stripe is connected
 */
export async function isStripeConnected(): Promise<boolean> {
  const account = await getStripeAccount();
  return account !== null && !!account.stripe_account_id;
}