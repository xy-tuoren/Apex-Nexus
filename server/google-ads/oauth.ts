export async function getAccessToken() {
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    return null;
  }

  const response = await fetch("https://www.googleapis.com/oauth2/v3/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OAuth refresh failed: ${response.status} — ${body}`);
  }

  const payload = (await response.json()) as { access_token: string };
  return payload.access_token;
}
