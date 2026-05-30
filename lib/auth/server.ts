import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  getAuthSecret,
  isAuthEnabled,
  SESSION_COOKIE,
} from "@/lib/auth/config";
import { verifySessionToken } from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/types";

export async function getSessionUser(): Promise<AuthUser | null> {
  if (!isAuthEnabled()) {
    return null;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token, getAuthSecret());
  return payload?.user ?? null;
}

export async function getSessionUserFromRequest(request: NextRequest) {
  if (!isAuthEnabled()) {
    return null;
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !process.env.AUTH_SECRET) {
    return null;
  }

  const payload = await verifySessionToken(token, process.env.AUTH_SECRET);
  return payload?.user ?? null;
}
