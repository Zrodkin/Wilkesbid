// app/api/admin/holiday-templates/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/auth';

// GET - List all holiday templates
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('holiday_templates')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    return NextResponse.json({ templates: data || [] });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST - Create new holiday template
export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, services } = await request.json();

    if (!name || !services || !Array.isArray(services) || services.length === 0) {
      return NextResponse.json(
        { error: 'Name and services array are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('holiday_templates')
      .insert({ name, services })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'A template with this name already exists' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ template: data });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}