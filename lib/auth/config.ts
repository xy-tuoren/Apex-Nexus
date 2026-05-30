const FEISHU_AUTHORIZE_URL = "https://accounts.feishu.cn/open-apis/authen/v1/authorize";
const FEISHU_TOKEN_URL = "https://open.feishu.cn/open-apis/authen/v2/oauth/token";
const FEISHU_USER_INFO_URL = "https://open.feishu.cn/open-apis/authen/v1/user_info";

export const SESSION_COOKIE = "apex_session";
export const OAUTH_STATE_COOKIE = "feishu_oauth_state";
export const OAUTH_FROM_COOKIE = "feishu_oauth_from";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10;

export function isAuthEnabled() {
  return Boolean(
    process.env.FEISHU_APP_ID &&
      process.env.FEISHU_APP_SECRET &&
      process.env.AUTH_SECRET,
  );
}

export function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return secret;
}

export function getFeishuCredentials() {
  const clientId = process.env.FEISHU_APP_ID;
  const clientSecret = process.env.FEISHU_APP_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("FEISHU_APP_ID or FEISHU_APP_SECRET is not configured");
  }

  return { clientId, clientSecret };
}

export function resolveRedirectUri(origin: string) {
  return process.env.FEISHU_REDIRECT_URI ?? `${origin}/api/auth/feishu/callback`;
}

export function buildFeishuAuthorizeUrl(input: {
  clientId: string;
  redirectUri: string;
  state: string;
}) {
  const url = new URL(FEISHU_AUTHORIZE_URL);
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("state", input.state);
  return url.toString();
}

export async function exchangeFeishuCode(input: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}) {
  const response = await fetch(FEISHU_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: input.clientId,
      client_secret: input.clientSecret,
      code: input.code,
      redirect_uri: input.redirectUri,
    }),
  });

  const payload = (await response.json()) as {
    code?: number;
    msg?: string;
    error?: string;
    error_description?: string;
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    token_type?: string;
    scope?: string;
  };

  if (!response.ok || payload.code !== 0 || !payload.access_token) {
    throw new Error(
      payload.error_description ??
        payload.msg ??
        payload.error ??
        `Feishu token exchange failed (${response.status})`,
    );
  }

  return {
    access_token: payload.access_token,
    expires_in: payload.expires_in ?? 0,
    refresh_token: payload.refresh_token,
    token_type: payload.token_type,
    scope: payload.scope,
  };
}

export async function fetchFeishuUserInfo(accessToken: string) {
  const response = await fetch(FEISHU_USER_INFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = (await response.json()) as {
    code?: number;
    msg?: string;
    data?: import("@/lib/auth/types").FeishuUserInfo;
  };

  if (!response.ok || payload.code !== 0 || !payload.data) {
    throw new Error(payload.msg ?? `Feishu user info failed (${response.status})`);
  }

  return payload.data;
}
