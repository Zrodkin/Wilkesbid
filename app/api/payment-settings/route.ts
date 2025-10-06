// app/api/payment-settings/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/auth';

// Global settings ID (we'll use a constant ID for global settings)
const GLOBAL_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('id', GLOBAL_SETTINGS_ID)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Return default settings if none exist
    return NextResponse.json(
      data || {
        installments_enabled: false,
        max_installments: 12,
      }
    );
  } catch (error) {
    console.error('Get payment settings error:', error);
    return NextResponse.json(
      { error: 'Failed to get payment settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { installmentsEnabled, maxInstallments } = body;

    const supabase = await createClient();

    // Check if global settings exist
    const { data: existing } = await supabase
      .from('payment_settings')
      .select('id')
      .eq('id', GLOBAL_SETTINGS_ID)
      .maybeSingle();

    if (existing) {
      // Update existing settings
      const { data, error } = await supabase
        .from('payment_settings')
        .update({
          installments_enabled: installmentsEnabled,
          max_installments: maxInstallments,
          updated_at: new Date().toISOString(),
        })
        .eq('id', GLOBAL_SETTINGS_ID)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    } else {
      // Create new global settings
      const { data, error } = await supabase
        .from('payment_settings')
        .insert({
          id: GLOBAL_SETTINGS_ID,
          installments_enabled: installmentsEnabled,
          max_installments: maxInstallments,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Update payment settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment settings' },
      { status: 500 }
    );
  }
}