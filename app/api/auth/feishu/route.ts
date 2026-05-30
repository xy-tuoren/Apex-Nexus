import { NextResponse, type NextRequest } from "next/server";
import {
  buildFeishuAuthorizeUrl,
  getFeishuCredentials,
  isAuthEnabled,
  OAUTH_FROM_COOKIE,
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_MAX_AGE_SECONDS,
  resolveRedirectUri,
} from "@/lib/auth/config";
import { createOAuthState } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  if (!isAuthEnabled()) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_NOT_CONFIGURED", message: "飞书登录未配置" } },
      { status: 503 },
    );
  }

  const { clientId } = getFeishuCredentials();
  const redirectUri = resolveRedirectUri(request.nextUrl.origin);
  const state = createOAuthState();
  const from = request.nextUrl.searchParams.get("from") ?? "/";

  const response = NextResponse.redirect(
    buildFeishuAuthorizeUrl({ clientId, redirectUri, state }),
  );

  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
    path: "/",
  });
  response.cookies.set(OAUTH_FROM_COOKIE, from, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
    path: "/",
  });

  return response;
}
