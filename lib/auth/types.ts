export type AuthUser = {
  openId: string;
  unionId?: string;
  name: string;
  avatarUrl?: string;
  email?: string;
};

export type SessionPayload = {
  user: AuthUser;
  exp: number;
};

export type FeishuTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  token_type?: string;
  scope?: string;
};

export type FeishuUserInfo = {
  name: string;
  en_name?: string;
  avatar_url?: string;
  avatar_thumb?: string;
  open_id: string;
  union_id?: string;
  email?: string;
  enterprise_email?: string;
  user_id?: string;
};
