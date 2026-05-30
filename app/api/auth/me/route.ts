import { NextResponse, type NextRequest } from "next/server";
import { isAuthEnabled } from "@/lib/auth/config";
import { getSessionUserFromRequest } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  const user = await getSessionUserFromRequest(request);
  return NextResponse.json({
    authenticated: Boolean(user),
    user,
    authEnabled: isAuthEnabled(),
  });
}
