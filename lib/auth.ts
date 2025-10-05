// lib/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

export async function verifyAdmin(request: Request): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    
    if (!token) return false;
    
    const decoded = jwt.verify(token, JWT_SECRET) as { isAdmin: boolean };
    return decoded.isAdmin === true;
  } catch {
    return false;
  }
}

export async function loginAdmin(password: string): Promise<string | null> {
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign(
      { isAdmin: true },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    return token;
  }
  return null;
}