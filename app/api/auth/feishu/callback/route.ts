import { NextResponse, type NextRequest } from "next/server";
import {
  exchangeFeishuCode,
  fetchFeishuUserInfo,
  getAuthSecret,
  getFeishuCredentials,
  isAuthEnabled,
  OAUTH_FROM_COOKIE,
  OAUTH_STATE_COOKIE,
  resolveRedirectUri,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/config";
import { createSessionToken } from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/types";

function redirectToLogin(request: NextRequest, error: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", error);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: NextRequest) {
  if (!isAuthEnabled()) {
    return redirectToLogin(request, "auth_not_configured");
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const returnTo = request.cookies.get(OAUTH_FROM_COOKIE)?.value ?? "/";

  if (!code) {
    return redirectToLogin(request, "missing_code");
  }

  if (!state || !storedState || state !== storedState) {
    return redirectToLogin(request, "invalid_state");
  }

  try {
    const { clientId, clientSecret } = getFeishuCredentials();
    const redirectUri = resolveRedirectUri(request.nextUrl.origin);
    const token = await exchangeFeishuCode({
      code,
      clientId,
      clientSecret,
      redirectUri,
    });
    const profile = await fetchFeishuUserInfo(token.access_token);

    const user: AuthUser = {
      openId: profile.open_id,
      unionId: profile.union_id,
      name: profile.name || profile.en_name || "飞书用户",
      avatarUrl: profile.avatar_thumb ?? profile.avatar_url,
      email: profile.enterprise_email ?? profile.email,
    };

    const sessionToken = await createSessionToken(user, getAuthSecret());
    const destination = returnTo.startsWith("/") ? returnTo : "/";
    const response = NextResponse.redirect(new URL(destination, request.url));

    response.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });
    response.cookies.set(OAUTH_STATE_COOKIE, "", { maxAge: 0, path: "/" });
    response.cookies.set(OAUTH_FROM_COOKIE, "", { maxAge: 0, path: "/" });

    return response;
  } catch (error) {
    console.error("[feishu/oauth/callback]", error);
    return redirectToLogin(request, "oauth_failed");
  }
}
