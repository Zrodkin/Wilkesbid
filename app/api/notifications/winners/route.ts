// app/api/notifications/winners/route.ts
import { NextResponse } from 'next/server';
import { sendWinnerNotifications } from '@/lib/email/sender';

export async function POST() {
  try {
    await sendWinnerNotifications();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send winner notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications' }, 
      { status: 500 }
    );
  }
}