import {
  YC_OAUTH_TOKEN
} from "./config.ts";
import type { IamTokenResponse } from "./types.ts";

// IAM-токен живёт 12ч. Кэшируем на 11ч и обновляем заранее.
let cached: { token: string; expiresAt: number } | null = null;
export async function getIamToken(): Promise<string> {

  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const res = await fetch("https://iam.api.cloud.yandex.net/iam/v1/tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ yandexPassportOauthToken: YC_OAUTH_TOKEN }),
  });

  if (!res.ok) {
    throw new Error(`IAM token exchange failed: ${res.status} ${await res.text()}`);
    process.exit(1)
  }

  const data = (await res.json()) as IamTokenResponse;
  cached = { token: data.iamToken, expiresAt: Date.now() + 11 * 3600 * 1000 };
  return data.iamToken;
}

export async function getApiAuthHeaders(): Promise<Record<string, string>> {
  return {
    Authorization: `Bearer ${await getIamToken()}`,
    "Content-Type": "application/json",
  };
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function log(msg: string): void {
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log(`[${ts}] ${msg}`);
}